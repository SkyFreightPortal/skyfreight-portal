package com.skyfreight.portal.controller;

import com.skyfreight.portal.dto.request.OrderCreateRequest;
import com.skyfreight.portal.dto.request.OrderStatusUpdateRequest;
import com.skyfreight.portal.dto.response.ApiResponse;
import com.skyfreight.portal.dto.response.OrderResponse;
import com.skyfreight.portal.entity.Offer;
import com.skyfreight.portal.entity.Order;
import com.skyfreight.portal.service.OrderService;
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

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@Tag(name = "Order Management", description = "Convert accepted offers into orders and manage order lifecycle")
public class OrderController {

    private static final String MANAGE_ROLES =
            "hasAnyRole('AIRLINE_ADMINISTRATOR','SALES_AGENT','CUSTOMER_ADMIN')";
    private static final String READ_ROLES =
            "hasAnyRole('AIRLINE_ADMINISTRATOR','SALES_AGENT','CUSTOMER_ADMIN','REVENUE_MANAGEMENT_USER','OPERATIONS_USER')";

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Convert an accepted offer into an order")
    @PreAuthorize(MANAGE_ROLES)
    public ResponseEntity<ApiResponse<OrderResponse>> create(@Valid @RequestBody OrderCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Order created", orderService.create(request)));
    }

    @GetMapping
    @Operation(summary = "List orders with optional filters and pagination")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> list(
            @RequestParam(required = false) Order.OrderStatus status,
            @RequestParam(required = false) String originAirport,
            @RequestParam(required = false) String destinationAirport,
            @RequestParam(required = false) Offer.ServiceType serviceType,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<OrderResponse> result = orderService.findAll(
                status, originAirport, destinationAirport, serviceType, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order details by ID")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(orderService.findById(id)));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update an order's status")
    @PreAuthorize(MANAGE_ROLES)
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable Long id, @Valid @RequestBody OrderStatusUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Order status updated", orderService.updateStatus(id, request.getStatus())));
    }
}
