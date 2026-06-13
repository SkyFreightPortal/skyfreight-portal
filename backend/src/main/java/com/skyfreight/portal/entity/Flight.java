package com.skyfreight.portal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "flights", indexes = {
        @Index(name = "idx_flight_route", columnList = "origin_airport, destination_airport")
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Flight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String flightNumber;

    @Column(nullable = false, length = 3)
    private String originAirport;

    @Column(nullable = false, length = 3)
    private String destinationAirport;

    @Column(nullable = false)
    private LocalTime departureTime;

    @Column(nullable = false)
    private LocalTime arrivalTime;

    @Column(nullable = false)
    private Integer durationMinutes;

    @Column(nullable = false, length = 7)
    private String daysOfWeek;

    @Column(nullable = false, length = 50)
    private String aircraftType;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalCapacityKg;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(10)")
    private UldType uldType;

    @Column(nullable = false)
    private Integer totalUldPositions;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public enum UldType {
        AKE(700),
        AKH(2200),
        PMC(6800),
        PAG(4600);

        private final int maxWeightKg;

        UldType(int maxWeightKg) {
            this.maxWeightKg = maxWeightKg;
        }

        public int getMaxWeightKg() {
            return maxWeightKg;
        }
    }
}
