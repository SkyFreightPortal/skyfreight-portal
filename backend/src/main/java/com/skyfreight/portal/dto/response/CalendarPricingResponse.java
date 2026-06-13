package com.skyfreight.portal.dto.response;

import com.skyfreight.portal.entity.Offer;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class CalendarPricingResponse {

    private String origin;
    private String destination;
    private Offer.ServiceType serviceType;
    private String currency;
    private List<CalendarDay> days;
    private LocalDate cheapestDate;
    private List<AirportPriceOption> alternativeAirports;

    @Data
    @Builder
    public static class CalendarDay {
        private LocalDate date;
        private DayOfWeek dayOfWeek;
        private boolean operatesDirectFlight;
        private BigDecimal price;
        private double availabilityPct;
        private boolean cheapest;
    }

    @Data
    @Builder
    public static class AirportPriceOption {
        private String originAirport;
        private String destinationAirport;
        private BigDecimal price;
        private BigDecimal savings;
        private String currency;
    }
}
