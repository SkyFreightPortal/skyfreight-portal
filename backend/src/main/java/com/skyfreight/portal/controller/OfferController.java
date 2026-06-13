package com.skyfreight.portal.controller;

import com.skyfreight.portal.dto.request.OfferCompareRequest;
import com.skyfreight.portal.dto.request.OfferCreateRequest;
import com.skyfreight.portal.dto.response.ApiResponse;
import com.skyfreight.portal.dto.response.OfferResponse;
import com.skyfreight.portal.entity.Offer;
import com.skyfreight.portal.service.OfferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/offers")
@RequiredArgsConstructor
@Tag(name = "Offer Management", description = "Create, price, compare and manage cargo offers")
public class OfferController {

    private static final String MANAGE_ROLES =
            "hasAnyRole('AIRLINE_ADMINISTRATOR','SALES_AGENT','CUSTOMER_ADMIN')";
    private static final String READ_ROLES =
            "hasAnyRole('AIRLINE_ADMINISTRATOR','SALES_AGENT','CUSTOMER_ADMIN','REVENUE_MANAGEMENT_USER','OPERATIONS_USER')";

    private final OfferService offerService;

    @PostMapping
    @Operation(summary = "Create a new cargo offer with calculated pricing")
    @PreAuthorize(MANAGE_ROLES)
    public ResponseEntity<ApiResponse<OfferResponse>> create(@Valid @RequestBody OfferCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Offer created", offerService.create(request)));
    }

    @GetMapping
    @Operation(summary = "List offers with optional filters and pagination")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<ApiResponse<Page<OfferResponse>>> list(
            @RequestParam(required = false) Offer.OfferStatus status,
            @RequestParam(required = false) String originAirport,
            @RequestParam(required = false) String destinationAirport,
            @RequestParam(required = false) Offer.ServiceType serviceType,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<OfferResponse> result = offerService.findAll(
                status, originAirport, destinationAirport, serviceType, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get offer details by ID")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<ApiResponse<OfferResponse>> getOffer(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(offerService.findById(id)));
    }

    @PostMapping("/{id}/revise")
    @Operation(summary = "Create a new, re-priced version of an existing offer")
    @PreAuthorize(MANAGE_ROLES)
    public ResponseEntity<ApiResponse<OfferResponse>> revise(
            @PathVariable Long id, @Valid @RequestBody OfferCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Offer revised", offerService.revise(id, request)));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Accept, reject or withdraw an offer")
    @PreAuthorize(MANAGE_ROLES)
    public ResponseEntity<ApiResponse<OfferResponse>> updateStatus(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        Offer.OfferStatus newStatus = Offer.OfferStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(ApiResponse.success("Offer status updated", offerService.updateStatus(id, newStatus)));
    }

    @PostMapping("/compare")
    @Operation(summary = "Compare multiple offers side-by-side")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<ApiResponse<List<OfferResponse>>> compare(@Valid @RequestBody OfferCompareRequest request) {
        return ResponseEntity.ok(ApiResponse.success(offerService.compare(request.getIds())));
    }
}
