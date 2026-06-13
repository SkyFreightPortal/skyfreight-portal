package com.skyfreight.portal.dto.response;

import com.skyfreight.portal.entity.Offer;
import com.skyfreight.portal.entity.OfferAncillaryService;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
public class OfferResponse {

    private Long id;
    private String offerNumber;

    private Long customerId;
    private String customerName;
    private String customerCompany;

    private Long createdById;
    private String createdByName;

    private String originAirport;
    private String destinationAirport;
    private Offer.ServiceType serviceType;
    private String commodity;

    private BigDecimal weightKg;
    private BigDecimal lengthCm;
    private BigDecimal widthCm;
    private BigDecimal heightCm;
    private BigDecimal volumetricWeightKg;
    private BigDecimal chargeableWeightKg;

    private Offer.TemperatureRequirement temperatureRequirement;
    private boolean dangerousGoods;
    private String dgClass;

    private Offer.TransitPreference transitPreference;
    private int estimatedTransitHours;

    private BigDecimal requestedCapacityKg;
    private boolean capacityAvailable;

    private Long rateCardId;
    private Offer.RateType rateType;
    private String currency;

    private BigDecimal baseCharge;
    private BigDecimal fuelSurcharge;
    private BigDecimal securitySurcharge;
    private BigDecimal screeningFee;
    private BigDecimal terminalHandlingFee;
    private BigDecimal customsFee;
    private BigDecimal ancillaryTotal;
    private BigDecimal totalPrice;
    private BigDecimal declaredValue;

    private List<AncillaryLineResponse> ancillaryServices;

    private Offer.OfferStatus status;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private LocalDateTime capacityHoldUntil;

    private Integer version;
    private Long parentOfferId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static OfferResponse from(Offer offer) {
        return OfferResponse.builder()
                .id(offer.getId())
                .offerNumber(offer.getOfferNumber())
                .customerId(offer.getCustomer().getId())
                .customerName(offer.getCustomer().getFullName())
                .customerCompany(offer.getCustomer().getCompany())
                .createdById(offer.getCreatedBy().getId())
                .createdByName(offer.getCreatedBy().getFullName())
                .originAirport(offer.getOriginAirport())
                .destinationAirport(offer.getDestinationAirport())
                .serviceType(offer.getServiceType())
                .commodity(offer.getCommodity())
                .weightKg(offer.getWeightKg())
                .lengthCm(offer.getLengthCm())
                .widthCm(offer.getWidthCm())
                .heightCm(offer.getHeightCm())
                .volumetricWeightKg(offer.getVolumetricWeightKg())
                .chargeableWeightKg(offer.getChargeableWeightKg())
                .temperatureRequirement(offer.getTemperatureRequirement())
                .dangerousGoods(offer.isDangerousGoods())
                .dgClass(offer.getDgClass())
                .transitPreference(offer.getTransitPreference())
                .estimatedTransitHours(offer.getEstimatedTransitHours())
                .requestedCapacityKg(offer.getRequestedCapacityKg())
                .capacityAvailable(offer.isCapacityAvailable())
                .rateCardId(offer.getRateCard() != null ? offer.getRateCard().getId() : null)
                .rateType(offer.getRateType())
                .currency(offer.getCurrency())
                .baseCharge(offer.getBaseCharge())
                .fuelSurcharge(offer.getFuelSurcharge())
                .securitySurcharge(offer.getSecuritySurcharge())
                .screeningFee(offer.getScreeningFee())
                .terminalHandlingFee(offer.getTerminalHandlingFee())
                .customsFee(offer.getCustomsFee())
                .ancillaryTotal(offer.getAncillaryTotal())
                .totalPrice(offer.getTotalPrice())
                .declaredValue(offer.getDeclaredValue())
                .ancillaryServices(offer.getAncillaryServices().stream()
                        .map(AncillaryLineResponse::from)
                        .collect(Collectors.toList()))
                .status(offer.getStatus())
                .validFrom(offer.getValidFrom())
                .validUntil(offer.getValidUntil())
                .capacityHoldUntil(offer.getCapacityHoldUntil())
                .version(offer.getVersion())
                .parentOfferId(offer.getParentOffer() != null ? offer.getParentOffer().getId() : null)
                .createdAt(offer.getCreatedAt())
                .updatedAt(offer.getUpdatedAt())
                .build();
    }

    @Data
    @Builder
    public static class AncillaryLineResponse {
        private Long id;
        private OfferAncillaryService.AncillaryServiceType serviceType;
        private BigDecimal price;
        private String notes;

        public static AncillaryLineResponse from(OfferAncillaryService a) {
            return AncillaryLineResponse.builder()
                    .id(a.getId())
                    .serviceType(a.getServiceType())
                    .price(a.getPrice())
                    .notes(a.getNotes())
                    .build();
        }
    }
}
