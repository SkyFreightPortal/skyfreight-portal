package com.skyfreight.portal.service;

import com.skyfreight.portal.dto.request.OfferCreateRequest;
import com.skyfreight.portal.entity.Offer;
import com.skyfreight.portal.entity.OfferAncillaryService;
import com.skyfreight.portal.entity.RateCard;
import com.skyfreight.portal.exception.NoRateAvailableException;
import com.skyfreight.portal.repository.RateCardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Core pricing engine for cargo offers — resolves the applicable rate card,
 * computes chargeable weight, surcharges and ancillary service charges.
 */
@Service
@RequiredArgsConstructor
public class RateCalculationService {

    private static final BigDecimal VOLUMETRIC_DIVISOR = BigDecimal.valueOf(6000);
    private static final BigDecimal INSURANCE_RATE = new BigDecimal("0.005");
    private static final BigDecimal INSURANCE_MIN = new BigDecimal("25.00");
    private static final BigDecimal INSURANCE_FLAT = new BigDecimal("30.00");

    private static final Map<OfferAncillaryService.AncillaryServiceType, BigDecimal> ANCILLARY_PRICES = Map.of(
            OfferAncillaryService.AncillaryServiceType.DOOR_PICKUP,         new BigDecimal("75.00"),
            OfferAncillaryService.AncillaryServiceType.LAST_MILE_DELIVERY,  new BigDecimal("120.00"),
            OfferAncillaryService.AncillaryServiceType.REFRIGERATED_STORAGE,new BigDecimal("200.00"),
            OfferAncillaryService.AncillaryServiceType.PALLETIZATION,       new BigDecimal("50.00"),
            OfferAncillaryService.AncillaryServiceType.PACKAGING,           new BigDecimal("40.00"),
            OfferAncillaryService.AncillaryServiceType.CUSTOMS_CLEARANCE,   new BigDecimal("60.00"),
            OfferAncillaryService.AncillaryServiceType.SCREENING,           new BigDecimal("45.00"),
            OfferAncillaryService.AncillaryServiceType.WAREHOUSING,         new BigDecimal("90.00")
    );

    private static final Map<Offer.ServiceType, Integer> BASE_TRANSIT_HOURS = Map.of(
            Offer.ServiceType.EXPRESS,         24,
            Offer.ServiceType.GENERAL_CARGO,   72,
            Offer.ServiceType.PHARMA,          36,
            Offer.ServiceType.PERISHABLE,      30,
            Offer.ServiceType.VALUABLE_CARGO,  48,
            Offer.ServiceType.LIVE_ANIMALS,    36,
            Offer.ServiceType.DANGEROUS_GOODS, 60,
            Offer.ServiceType.PRIORITY,        18
    );

    private final RateCardRepository rateCardRepository;

    public PricingResult calculate(OfferCreateRequest request) {
        BigDecimal volumetricWeight = computeVolumetricWeight(
                request.getLengthCm(), request.getWidthCm(), request.getHeightCm());
        BigDecimal chargeableWeight = (volumetricWeight != null)
                ? request.getWeightKg().max(volumetricWeight)
                : request.getWeightKg();

        LanePrice lanePrice = quote(
                request.getOriginAirport(), request.getDestinationAirport(),
                request.getServiceType(), request.getRateType(),
                chargeableWeight, request.getRequestedCapacityKg());
        RateCard rateCard = lanePrice.rateCard();

        List<OfferAncillaryService> ancillaryLines = buildAncillaryLines(
                request.getAncillaryServices(), request.getDeclaredValue());
        BigDecimal ancillaryTotal = ancillaryLines.stream()
                .map(OfferAncillaryService::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPrice = lanePrice.totalPrice()
                .add(ancillaryTotal)
                .setScale(2, RoundingMode.HALF_UP);

        int estimatedTransitHours = estimateTransitHours(request.getServiceType(), request.getTransitPreference());

        return new PricingResult(
                volumetricWeight,
                chargeableWeight,
                rateCard,
                lanePrice.rateTypeUsed(),
                lanePrice.currency(),
                lanePrice.baseCharge(),
                lanePrice.fuelSurcharge(),
                rateCard.getSecuritySurcharge(),
                rateCard.getScreeningFee(),
                rateCard.getTerminalHandlingFee(),
                rateCard.getCustomsFee(),
                ancillaryLines,
                ancillaryTotal,
                totalPrice,
                estimatedTransitHours,
                lanePrice.capacityAvailable()
        );
    }

    /**
     * Prices a lane/service/rate combination without persisting anything or pricing
     * ancillary services — used by offer creation (via {@link #calculate}) and by the
     * shopping/search quoting endpoints.
     */
    public LanePrice quote(String origin, String destination, Offer.ServiceType serviceType,
                            Offer.RateType rateType, BigDecimal chargeableWeightKg, BigDecimal requestedCapacityKg) {
        RateMatch rateMatch = resolveRateCard(origin, destination, serviceType, rateType);
        RateCard rateCard = rateMatch.rateCard();

        BigDecimal baseCharge = chargeableWeightKg.multiply(rateCard.getRatePerKg())
                .max(rateCard.getMinimumCharge())
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal fuelSurcharge = baseCharge.multiply(rateCard.getFuelSurchargePct())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal feesTotal = rateCard.getSecuritySurcharge()
                .add(rateCard.getScreeningFee())
                .add(rateCard.getTerminalHandlingFee())
                .add(rateCard.getCustomsFee());

        BigDecimal totalPrice = baseCharge.add(fuelSurcharge).add(feesTotal)
                .setScale(2, RoundingMode.HALF_UP);

        boolean capacityAvailable = requestedCapacityKg.compareTo(rateCard.getAvailableCapacityKg()) <= 0;

        return new LanePrice(
                rateCard,
                rateMatch.rateTypeUsed(),
                rateCard.getCurrency(),
                baseCharge,
                fuelSurcharge,
                feesTotal,
                totalPrice,
                capacityAvailable
        );
    }

    private BigDecimal computeVolumetricWeight(BigDecimal lengthCm, BigDecimal widthCm, BigDecimal heightCm) {
        if (lengthCm == null || widthCm == null || heightCm == null) {
            return null;
        }
        return lengthCm.multiply(widthCm).multiply(heightCm)
                .divide(VOLUMETRIC_DIVISOR, 2, RoundingMode.HALF_UP);
    }

    private RateMatch resolveRateCard(String origin, String destination,
                                       Offer.ServiceType serviceType, Offer.RateType requestedRateType) {
        LocalDate today = LocalDate.now();

        List<RateCard> matches = rateCardRepository.findMatches(origin, destination, serviceType, requestedRateType, today);
        if (!matches.isEmpty()) {
            return new RateMatch(matches.get(0), requestedRateType);
        }

        if (requestedRateType != Offer.RateType.PUBLISHED) {
            List<RateCard> fallback = rateCardRepository.findMatches(origin, destination, serviceType, Offer.RateType.PUBLISHED, today);
            if (!fallback.isEmpty()) {
                return new RateMatch(fallback.get(0), Offer.RateType.PUBLISHED);
            }
        }

        throw new NoRateAvailableException(origin, destination, serviceType);
    }

    private List<OfferAncillaryService> buildAncillaryLines(
            List<OfferAncillaryService.AncillaryServiceType> requested, BigDecimal declaredValue) {
        List<OfferAncillaryService> lines = new ArrayList<>();
        if (requested == null) {
            return lines;
        }
        for (OfferAncillaryService.AncillaryServiceType type : requested) {
            BigDecimal price = (type == OfferAncillaryService.AncillaryServiceType.INSURANCE)
                    ? calculateInsurancePrice(declaredValue)
                    : ANCILLARY_PRICES.get(type);
            lines.add(OfferAncillaryService.builder()
                    .serviceType(type)
                    .price(price)
                    .build());
        }
        return lines;
    }

    private BigDecimal calculateInsurancePrice(BigDecimal declaredValue) {
        if (declaredValue == null) {
            return INSURANCE_FLAT;
        }
        return declaredValue.multiply(INSURANCE_RATE)
                .max(INSURANCE_MIN)
                .setScale(2, RoundingMode.HALF_UP);
    }

    public int estimateTransitHours(Offer.ServiceType serviceType, Offer.TransitPreference preference) {
        int base = BASE_TRANSIT_HOURS.get(serviceType);
        double multiplier = switch (preference) {
            case EXPRESS -> 0.7;
            case ECONOMY -> 1.5;
            case STANDARD -> 1.0;
        };
        return (int) Math.round(base * multiplier);
    }

    public int getBaseTransitHours(Offer.ServiceType serviceType) {
        return BASE_TRANSIT_HOURS.get(serviceType);
    }

    private record RateMatch(RateCard rateCard, Offer.RateType rateTypeUsed) {}

    public record PricingResult(
            BigDecimal volumetricWeightKg,
            BigDecimal chargeableWeightKg,
            RateCard rateCard,
            Offer.RateType rateTypeUsed,
            String currency,
            BigDecimal baseCharge,
            BigDecimal fuelSurcharge,
            BigDecimal securitySurcharge,
            BigDecimal screeningFee,
            BigDecimal terminalHandlingFee,
            BigDecimal customsFee,
            List<OfferAncillaryService> ancillaryLines,
            BigDecimal ancillaryTotal,
            BigDecimal totalPrice,
            int estimatedTransitHours,
            boolean capacityAvailable
    ) {}

    public record LanePrice(
            RateCard rateCard,
            Offer.RateType rateTypeUsed,
            String currency,
            BigDecimal baseCharge,
            BigDecimal fuelSurcharge,
            BigDecimal feesTotal,
            BigDecimal totalPrice,
            boolean capacityAvailable
    ) {}
}
