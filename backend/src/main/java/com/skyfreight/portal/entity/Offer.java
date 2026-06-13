package com.skyfreight.portal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "offers", indexes = {
        @Index(name = "idx_offer_status", columnList = "status"),
        @Index(name = "idx_offer_customer", columnList = "customer_id"),
        @Index(name = "idx_offer_route", columnList = "origin_airport, destination_airport")
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Offer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 20)
    private String offerNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @Column(nullable = false, length = 3)
    private String originAirport;

    @Column(nullable = false, length = 3)
    private String destinationAirport;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(30)")
    private ServiceType serviceType;

    @Column(nullable = false, length = 150)
    private String commodity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal weightKg;

    @Column(precision = 10, scale = 2)
    private BigDecimal lengthCm;

    @Column(precision = 10, scale = 2)
    private BigDecimal widthCm;

    @Column(precision = 10, scale = 2)
    private BigDecimal heightCm;

    @Column(precision = 10, scale = 2)
    private BigDecimal volumetricWeightKg;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal chargeableWeightKg;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(30)")
    @Builder.Default
    private TemperatureRequirement temperatureRequirement = TemperatureRequirement.NONE;

    @Column(nullable = false)
    private boolean dangerousGoods;

    @Column(length = 100)
    private String dgClass;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(20)")
    @Builder.Default
    private TransitPreference transitPreference = TransitPreference.STANDARD;

    @Column(nullable = false)
    private Integer estimatedTransitHours;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal requestedCapacityKg;

    @Column(nullable = false)
    private boolean capacityAvailable;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rate_card_id")
    private RateCard rateCard;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(20)")
    private RateType rateType;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal baseCharge;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal fuelSurcharge = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal securitySurcharge = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal screeningFee = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal terminalHandlingFee = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal customsFee = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal ancillaryTotal = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Column(precision = 10, scale = 2)
    private BigDecimal declaredValue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(20)")
    @Builder.Default
    private OfferStatus status = OfferStatus.ACTIVE;

    @Column(nullable = false)
    private LocalDateTime validFrom;

    @Column(nullable = false)
    private LocalDateTime validUntil;

    @Column(nullable = false)
    private LocalDateTime capacityHoldUntil;

    @Column(nullable = false)
    @Builder.Default
    private Integer version = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_offer_id")
    private Offer parentOffer;

    @OneToMany(mappedBy = "offer", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<OfferAncillaryService> ancillaryServices = new ArrayList<>();

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public enum ServiceType {
        EXPRESS,
        GENERAL_CARGO,
        PHARMA,
        PERISHABLE,
        VALUABLE_CARGO,
        LIVE_ANIMALS,
        DANGEROUS_GOODS,
        PRIORITY
    }

    public enum RateType {
        PUBLISHED,
        CONTRACT,
        SPOT,
        DYNAMIC,
        SEASONAL
    }

    public enum TemperatureRequirement {
        NONE,
        CHILLED,
        FROZEN,
        CONTROLLED_ROOM_TEMP
    }

    public enum TransitPreference {
        STANDARD,
        EXPRESS,
        ECONOMY
    }

    public enum OfferStatus {
        DRAFT,
        ACTIVE,
        ACCEPTED,
        REJECTED,
        EXPIRED,
        SUPERSEDED,
        WITHDRAWN
    }
}
