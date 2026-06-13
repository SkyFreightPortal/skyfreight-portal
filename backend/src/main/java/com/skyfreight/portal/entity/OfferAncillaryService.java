package com.skyfreight.portal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "offer_ancillary_services", indexes = {
        @Index(name = "idx_ancillary_offer", columnList = "offer_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OfferAncillaryService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offer_id", nullable = false)
    private Offer offer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(30)")
    private AncillaryServiceType serviceType;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(length = 200)
    private String notes;

    public enum AncillaryServiceType {
        DOOR_PICKUP,
        LAST_MILE_DELIVERY,
        REFRIGERATED_STORAGE,
        PALLETIZATION,
        PACKAGING,
        INSURANCE,
        CUSTOMS_CLEARANCE,
        SCREENING,
        WAREHOUSING
    }
}
