package com.skyfreight.portal.dto.response;

import com.skyfreight.portal.entity.Offer;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
public class RouteSearchResponse {

    private String origin;
    private String destination;
    private LocalDate date;
    private Offer.ServiceType serviceType;
    private String currency;
    private List<RouteOption> options;

    @Data
    @Builder
    public static class RouteOption {
        private String type;
        private List<FlightLeg> legs;
        private int totalDurationMinutes;
        private String connectionAirport;
        private Integer layoverMinutes;
        private BigDecimal totalPrice;
        private boolean capacityAvailable;
    }

    @Data
    @Builder
    public static class FlightLeg {
        private String flightNumber;
        private String origin;
        private String destination;
        private LocalTime departureTime;
        private LocalTime arrivalTime;
        private int durationMinutes;
        private String aircraftType;
    }
}
