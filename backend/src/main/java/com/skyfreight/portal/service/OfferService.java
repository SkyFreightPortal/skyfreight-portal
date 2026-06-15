package com.skyfreight.portal.service;

import com.skyfreight.portal.dto.request.OfferCreateRequest;
import com.skyfreight.portal.dto.response.OfferResponse;
import com.skyfreight.portal.entity.Offer;
import com.skyfreight.portal.entity.Order;
import com.skyfreight.portal.entity.User;
import com.skyfreight.portal.exception.OfferNotFoundException;
import com.skyfreight.portal.exception.UserNotFoundException;
import com.skyfreight.portal.repository.OfferRepository;
import com.skyfreight.portal.repository.OrderRepository;
import com.skyfreight.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OfferService {

    private static final int DEFAULT_VALIDITY_DAYS = 7;
    private static final int CAPACITY_HOLD_HOURS = 48;

    private static final Map<Offer.OfferStatus, Set<Offer.OfferStatus>> ALLOWED_TRANSITIONS = Map.of(
            Offer.OfferStatus.ACTIVE, Set.of(
                    Offer.OfferStatus.ACCEPTED, Offer.OfferStatus.REJECTED, Offer.OfferStatus.WITHDRAWN)
    );

    private final OfferRepository offerRepository;
    private final UserRepository userRepository;
    private final RateCalculationService rateCalculationService;
    private final OrderRepository orderRepository;

    @Transactional
    public OfferResponse create(OfferCreateRequest request) {
        Offer offer = buildOffer(request, 1, null);
        Offer saved = persistWithOfferNumber(offer);
        log.info("Offer {} created for customer {}", saved.getOfferNumber(), saved.getCustomer().getEmail());
        return OfferResponse.from(saved);
    }

    @Transactional
    public OfferResponse revise(Long id, OfferCreateRequest request) {
        Offer parent = offerRepository.findById(id)
                .orElseThrow(() -> new OfferNotFoundException(id));

        if (parent.getStatus() == Offer.OfferStatus.SUPERSEDED
                || parent.getStatus() == Offer.OfferStatus.WITHDRAWN) {
            throw new IllegalStateException("Cannot revise an offer with status " + parent.getStatus());
        }

        Offer revised = buildOffer(request, parent.getVersion() + 1, parent);
        Offer saved = persistWithOfferNumber(revised);

        parent.setStatus(Offer.OfferStatus.SUPERSEDED);
        offerRepository.save(parent);

        log.info("Offer {} revised as {} (v{})", parent.getOfferNumber(), saved.getOfferNumber(), saved.getVersion());
        return OfferResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public Page<OfferResponse> findAll(Offer.OfferStatus status, String originAirport, String destinationAirport,
                                        Offer.ServiceType serviceType, String search, Pageable pageable) {
        return offerRepository.findAllWithFilters(status, originAirport, destinationAirport, serviceType, search, pageable)
                .map(offer -> OfferResponse.from(offer, orderIdFor(offer)));
    }

    @Transactional(readOnly = true)
    public OfferResponse findById(Long id) {
        Offer offer = offerRepository.findById(id)
                .orElseThrow(() -> new OfferNotFoundException(id));
        return OfferResponse.from(offer, orderIdFor(offer));
    }

    @Transactional(readOnly = true)
    public List<OfferResponse> compare(List<Long> ids) {
        return offerRepository.findByIdIn(ids).stream()
                .map(offer -> OfferResponse.from(offer, orderIdFor(offer)))
                .collect(Collectors.toList());
    }

    private Long orderIdFor(Offer offer) {
        return orderRepository.findByOfferId(offer.getId()).map(Order::getId).orElse(null);
    }

    @Transactional
    public OfferResponse updateStatus(Long id, Offer.OfferStatus newStatus) {
        Offer offer = offerRepository.findById(id)
                .orElseThrow(() -> new OfferNotFoundException(id));

        Set<Offer.OfferStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(offer.getStatus(), Set.of());
        if (!allowed.contains(newStatus)) {
            throw new IllegalStateException(
                    "Cannot change offer status from " + offer.getStatus() + " to " + newStatus);
        }

        offer.setStatus(newStatus);
        log.info("Offer {} status changed to {}", offer.getOfferNumber(), newStatus);
        return OfferResponse.from(offerRepository.save(offer));
    }

    private Offer buildOffer(OfferCreateRequest request, int version, Offer parent) {
        User customer = userRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new UserNotFoundException(request.getCustomerId()));
        User createdBy = currentUser();

        RateCalculationService.PricingResult pricing = rateCalculationService.calculate(request);

        LocalDateTime now = LocalDateTime.now();
        int validityDays = request.getValidityDays() != null ? request.getValidityDays() : DEFAULT_VALIDITY_DAYS;

        Offer offer = Offer.builder()
                .customer(customer)
                .createdBy(createdBy)
                .originAirport(request.getOriginAirport().toUpperCase())
                .destinationAirport(request.getDestinationAirport().toUpperCase())
                .serviceType(request.getServiceType())
                .commodity(request.getCommodity())
                .weightKg(request.getWeightKg())
                .lengthCm(request.getLengthCm())
                .widthCm(request.getWidthCm())
                .heightCm(request.getHeightCm())
                .volumetricWeightKg(pricing.volumetricWeightKg())
                .chargeableWeightKg(pricing.chargeableWeightKg())
                .temperatureRequirement(request.getTemperatureRequirement())
                .dangerousGoods(request.isDangerousGoods())
                .dgClass(request.getDgClass())
                .transitPreference(request.getTransitPreference())
                .estimatedTransitHours(pricing.estimatedTransitHours())
                .requestedCapacityKg(request.getRequestedCapacityKg())
                .capacityAvailable(pricing.capacityAvailable())
                .rateCard(pricing.rateCard())
                .rateType(pricing.rateTypeUsed())
                .currency(pricing.currency())
                .baseCharge(pricing.baseCharge())
                .fuelSurcharge(pricing.fuelSurcharge())
                .securitySurcharge(pricing.securitySurcharge())
                .screeningFee(pricing.screeningFee())
                .terminalHandlingFee(pricing.terminalHandlingFee())
                .customsFee(pricing.customsFee())
                .ancillaryTotal(pricing.ancillaryTotal())
                .totalPrice(pricing.totalPrice())
                .declaredValue(request.getDeclaredValue())
                .status(Offer.OfferStatus.ACTIVE)
                .validFrom(now)
                .validUntil(now.plusDays(validityDays))
                .capacityHoldUntil(now.plusHours(CAPACITY_HOLD_HOURS))
                .version(version)
                .parentOffer(parent)
                .build();

        pricing.ancillaryLines().forEach(line -> {
            line.setOffer(offer);
            offer.getAncillaryServices().add(line);
        });

        return offer;
    }

    private Offer persistWithOfferNumber(Offer offer) {
        Offer saved = offerRepository.save(offer);
        saved.setOfferNumber(String.format("OFR-%d-%06d", saved.getCreatedAt().getYear(), saved.getId()));
        return offerRepository.save(saved);
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException(email));
    }
}
