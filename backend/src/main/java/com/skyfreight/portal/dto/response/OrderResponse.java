package com.skyfreight.portal.dto.response;

import com.skyfreight.portal.entity.Offer;
import com.skyfreight.portal.entity.OfferAncillaryService;
import com.skyfreight.portal.entity.Order;
import com.skyfreight.portal.entity.OrderAncillaryService;
import com.skyfreight.portal.entity.ShipmentParty;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
public class OrderResponse {

    private Long id;
    private String orderNumber;

    private Long offerId;
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

    private BigDecimal chargeableWeightKg;
    private BigDecimal requestedCapacityKg;
    private String currency;
    private BigDecimal totalPrice;

    private LocalDate requestedShipDate;
    private String specialInstructions;

    private ShipmentPartyResponse consignor;
    private ShipmentPartyResponse consignee;
    private ShipmentPartyResponse notifyParty;

    private List<AncillaryLineResponse> ancillaryServices;

    private Order.OrderStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static OrderResponse from(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .offerId(order.getOffer().getId())
                .offerNumber(order.getOffer().getOfferNumber())
                .customerId(order.getCustomer().getId())
                .customerName(order.getCustomer().getFullName())
                .customerCompany(order.getCustomer().getCompany())
                .createdById(order.getCreatedBy().getId())
                .createdByName(order.getCreatedBy().getFullName())
                .originAirport(order.getOriginAirport())
                .destinationAirport(order.getDestinationAirport())
                .serviceType(order.getServiceType())
                .commodity(order.getCommodity())
                .chargeableWeightKg(order.getChargeableWeightKg())
                .requestedCapacityKg(order.getRequestedCapacityKg())
                .currency(order.getCurrency())
                .totalPrice(order.getTotalPrice())
                .requestedShipDate(order.getRequestedShipDate())
                .specialInstructions(order.getSpecialInstructions())
                .consignor(ShipmentPartyResponse.from(order.getConsignor()))
                .consignee(ShipmentPartyResponse.from(order.getConsignee()))
                .notifyParty(isPresent(order.getNotifyParty()) ? ShipmentPartyResponse.from(order.getNotifyParty()) : null)
                .ancillaryServices(order.getAncillaryServices().stream()
                        .map(AncillaryLineResponse::from)
                        .collect(Collectors.toList()))
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private static boolean isPresent(ShipmentParty party) {
        return party != null && party.getName() != null && !party.getName().isBlank();
    }

    @Data
    @Builder
    public static class ShipmentPartyResponse {
        private String name;
        private String company;
        private String addressLine1;
        private String addressLine2;
        private String city;
        private String stateProvince;
        private String postalCode;
        private String country;
        private String phone;
        private String email;

        public static ShipmentPartyResponse from(ShipmentParty party) {
            return ShipmentPartyResponse.builder()
                    .name(party.getName())
                    .company(party.getCompany())
                    .addressLine1(party.getAddressLine1())
                    .addressLine2(party.getAddressLine2())
                    .city(party.getCity())
                    .stateProvince(party.getStateProvince())
                    .postalCode(party.getPostalCode())
                    .country(party.getCountry())
                    .phone(party.getPhone())
                    .email(party.getEmail())
                    .build();
        }
    }

    @Data
    @Builder
    public static class AncillaryLineResponse {
        private Long id;
        private OfferAncillaryService.AncillaryServiceType serviceType;
        private BigDecimal price;
        private String notes;

        public static AncillaryLineResponse from(OrderAncillaryService a) {
            return AncillaryLineResponse.builder()
                    .id(a.getId())
                    .serviceType(a.getServiceType())
                    .price(a.getPrice())
                    .notes(a.getNotes())
                    .build();
        }
    }
}
