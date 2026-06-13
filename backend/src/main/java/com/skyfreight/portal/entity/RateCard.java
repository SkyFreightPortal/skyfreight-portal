package com.skyfreight.portal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "rate_cards", indexes = {
        @Index(name = "idx_rate_lane", columnList = "origin_airport, destination_airport, service_type, rate_type")
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RateCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 3)
    private String originAirport;

    @Column(nullable = false, length = 3)
    private String destinationAirport;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(30)")
    private Offer.ServiceType serviceType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(20)")
    private Offer.RateType rateType;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal ratePerKg;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal minimumCharge;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal fuelSurchargePct;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal securitySurcharge;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal screeningFee;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal terminalHandlingFee;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal customsFee;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal availableCapacityKg;

    @Column
    private LocalDate seasonStart;

    @Column
    private LocalDate seasonEnd;

    @Column(nullable = false)
    private LocalDate validFrom;

    @Column(nullable = false)
    private LocalDate validTo;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
