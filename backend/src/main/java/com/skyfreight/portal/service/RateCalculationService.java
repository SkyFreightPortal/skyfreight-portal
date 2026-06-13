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

        RateMatch rateMatch = resolveRateCard(
                request.getOriginAirport(), request.getDestinationAirport(),
                request.getServiceType(), request.getRateType());
        RateCard rateCard = rateMatch.rateCard();

        BigDecimal baseCharge = chargeableWeight.multiply(rateCard.getRatePerKg())
                .max(rateCard.getMinimumCharge())
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal fuelSurcharge = baseCharge.multiply(rateCard.getFuelSurchargePct())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        List<OfferAncillaryService> ancillaryLines = buildAncillaryLines(
                request.getAncillaryServices(), request.getDeclaredValue());
        BigDecimal ancillaryTotal = ancillaryLines.stream()
                .map(OfferAncillaryService::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPrice = baseCharge
                .add(fuelSurcharge)
                .add(rateCard.getSecuritySurcharge())
                .add(rateCard.getScreeningFee())
                .add(rateCard.getTerminalHandlingFee())
                .add(rateCard.getCustomsFee())
                .add(ancillaryTotal)
                .setScale(2, RoundingMode.HALF_UP);

        int estimatedTransitHours = estimateTransitHours(request.getServiceType(), request.getTransitPreference());
        boolean capacityAvailable = request.getRequestedCapacityKg()
                .compareTo(rateCard.getAvailableCapacityKg()) <= 0;

        return new PricingResult(
                volumetricWeight,
                chargeableWeight,
                rateCard,
                rateMatch.rateTypeUsed(),
                rateCard.getCurrency(),
                baseCharge,
                fuelSurcharge,
                rateCard.getSecuritySurcharge(),
                rateCard.getScreeningFee(),
                rateCard.getTerminalHandlingFee(),
                rateCard.getCustomsFee(),
                ancillaryLines,
                ancillaryTotal,
                totalPrice,
                estimatedTransitHours,
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

    private int estimateTransitHours(Offer.ServiceType serviceType, Offer.TransitPreference preference) {
        int base = BASE_TRANSIT_HOURS.get(serviceType);
        double multiplier = switch (preference) {
            case EXPRESS -> 0.7;
            case ECONOMY -> 1.5;
            case STANDARD -> 1.0;
        };
        return (int) Math.round(base * multiplier);
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
}
