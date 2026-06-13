package com.skyfreight.portal.dto.request;

import com.skyfreight.portal.entity.Offer;
import com.skyfreight.portal.entity.OfferAncillaryService;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class OfferCreateRequest {

    @NotNull
    private Long customerId;

    @NotBlank
    @Size(min = 3, max = 3)
    private String originAirport;

    @NotBlank
    @Size(min = 3, max = 3)
    private String destinationAirport;

    @NotNull
    private Offer.ServiceType serviceType;

    @NotBlank
    @Size(max = 150)
    private String commodity;

    @NotNull
    @Positive
    private BigDecimal weightKg;

    @Positive
    private BigDecimal lengthCm;

    @Positive
    private BigDecimal widthCm;

    @Positive
    private BigDecimal heightCm;

    @NotNull
    private Offer.TemperatureRequirement temperatureRequirement;

    private boolean dangerousGoods;

    @Size(max = 100)
    private String dgClass;

    @NotNull
    private Offer.TransitPreference transitPreference;

    @NotNull
    @Positive
    private BigDecimal requestedCapacityKg;

    @NotNull
    private Offer.RateType rateType;

    @PositiveOrZero
    private BigDecimal declaredValue;

    private List<OfferAncillaryService.AncillaryServiceType> ancillaryServices;

    @Positive
    private Integer validityDays;
}
