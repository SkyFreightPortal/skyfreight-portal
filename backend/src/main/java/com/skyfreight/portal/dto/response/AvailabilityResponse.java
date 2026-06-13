package com.skyfreight.portal.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
public class AvailabilityResponse {

    private String origin;
    private String destination;
    private LocalDate date;
    private List<FlightAvailability> flights;
    private List<RouteSearchResponse.RouteOption> connections;

    @Data
    @Builder
    public static class FlightAvailability {
        private String flightNumber;
        private LocalTime departureTime;
        private LocalTime arrivalTime;
        private int durationMinutes;
        private String aircraftType;
        private BigDecimal totalCapacityKg;
        private BigDecimal availableCapacityKg;
        private double capacityUtilizationPct;
        private String uldType;
        private int totalUldPositions;
        private int availableUldPositions;
    }
}
