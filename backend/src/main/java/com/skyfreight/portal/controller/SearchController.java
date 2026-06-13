package com.skyfreight.portal.controller;

import com.skyfreight.portal.dto.response.ApiResponse;
import com.skyfreight.portal.dto.response.AvailabilityResponse;
import com.skyfreight.portal.dto.response.CalendarPricingResponse;
import com.skyfreight.portal.dto.response.RecommendationResponse;
import com.skyfreight.portal.dto.response.RouteSearchResponse;
import com.skyfreight.portal.entity.Offer;
import com.skyfreight.portal.service.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;

@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
@Tag(name = "Shopping & Search", description = "Route search, availability, calendar pricing and recommendations")
public class SearchController {

    private static final String READ_ROLES =
            "hasAnyRole('AIRLINE_ADMINISTRATOR','SALES_AGENT','CUSTOMER_ADMIN','REVENUE_MANAGEMENT_USER','OPERATIONS_USER')";

    private final SearchService searchService;

    @GetMapping("/routes")
    @Operation(summary = "Search route options (direct and connecting) for an origin/destination/date")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<ApiResponse<RouteSearchResponse>> searchRoutes(
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "GENERAL_CARGO") Offer.ServiceType serviceType,
            @RequestParam(defaultValue = "PUBLISHED") Offer.RateType rateType,
            @RequestParam(defaultValue = "100") BigDecimal weightKg) {
        RouteSearchResponse response = searchService.searchRoutes(
                airportCode(origin, "origin"), airportCode(destination, "destination"),
                date, serviceType, rateType, weightKg);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/availability")
    @Operation(summary = "Check flight, space, ULD and connection availability for an origin/destination/date")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<ApiResponse<AvailabilityResponse>> getAvailability(
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        AvailabilityResponse response = searchService.getAvailability(
                airportCode(origin, "origin"), airportCode(destination, "destination"), date);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/calendar")
    @Operation(summary = "Calendar pricing across a date range, including cheapest day and alternative airports")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<ApiResponse<CalendarPricingResponse>> getCalendarPricing(
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam(defaultValue = "GENERAL_CARGO") Offer.ServiceType serviceType,
            @RequestParam(defaultValue = "PUBLISHED") Offer.RateType rateType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(defaultValue = "7") Integer days) {
        LocalDate from = (startDate != null) ? startDate : LocalDate.now();
        CalendarPricingResponse response = searchService.getCalendarPricing(
                airportCode(origin, "origin"), airportCode(destination, "destination"),
                serviceType, rateType, from, days);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/recommendations")
    @Operation(summary = "Suggest faster routes, lower-cost routes, alternative products and nearby airports")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<ApiResponse<RecommendationResponse>> getRecommendations(
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam(defaultValue = "GENERAL_CARGO") Offer.ServiceType serviceType,
            @RequestParam(defaultValue = "PUBLISHED") Offer.RateType rateType,
            @RequestParam(defaultValue = "100") BigDecimal weightKg,
            @RequestParam(defaultValue = "NONE") Offer.TemperatureRequirement temperatureRequirement,
            @RequestParam(defaultValue = "false") boolean dangerousGoods) {
        RecommendationResponse response = searchService.getRecommendations(
                airportCode(origin, "origin"), airportCode(destination, "destination"),
                serviceType, rateType, weightKg, temperatureRequirement, dangerousGoods);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private String airportCode(String code, String paramName) {
        if (code == null) {
            throw new IllegalArgumentException(paramName + " is required");
        }
        String upper = code.trim().toUpperCase();
        if (!upper.matches("[A-Z]{3}")) {
            throw new IllegalArgumentException(paramName + " must be a 3-letter IATA airport code");
        }
        return upper;
    }
}
