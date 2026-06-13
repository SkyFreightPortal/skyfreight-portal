package com.skyfreight.portal.dto.response;

import com.skyfreight.portal.entity.Offer;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class RecommendationResponse {

    private List<ServiceAlternative> fasterRoutes;
    private List<ServiceAlternative> lowerCostRoutes;
    private List<ServiceAlternative> alternativeProducts;
    private List<CalendarPricingResponse.AirportPriceOption> nearbyAirports;

    @Data
    @Builder
    public static class ServiceAlternative {
        private Offer.ServiceType serviceType;
        private BigDecimal price;
        private String currency;
        private int transitHours;
        private BigDecimal savings;
    }
}
