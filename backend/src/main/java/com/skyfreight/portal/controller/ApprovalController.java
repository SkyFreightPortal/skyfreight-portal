package com.skyfreight.portal.controller;

import com.skyfreight.portal.dto.request.ApprovalDecisionRequest;
import com.skyfreight.portal.dto.response.ApiResponse;
import com.skyfreight.portal.dto.response.ApprovalResponse;
import com.skyfreight.portal.entity.ApprovalWorkflow;
import com.skyfreight.portal.service.ApprovalService;
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

import java.util.Map;

@RestController
@RequestMapping("/approvals")
@RequiredArgsConstructor
@Tag(name = "Approval Workflows", description = "Manage registration approval requests")
public class ApprovalController {

    private final ApprovalService approvalService;

    @GetMapping
    @Operation(summary = "List approval requests filtered by status")
    @PreAuthorize("hasAnyRole('AIRLINE_ADMINISTRATOR','SALES_AGENT')")
    public ResponseEntity<ApiResponse<Page<ApprovalResponse>>> list(
            @RequestParam(defaultValue = "PENDING") ApprovalWorkflow.ApprovalStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(approvalService.findByStatus(status, pageable)));
    }

    @GetMapping("/pending/count")
    @Operation(summary = "Get count of pending approval requests")
    @PreAuthorize("hasAnyRole('AIRLINE_ADMINISTRATOR','SALES_AGENT')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> pendingCount() {
        long count = approvalService.countPending();
        return ResponseEntity.ok(ApiResponse.success(Map.of("pendingCount", count)));
    }

    @PostMapping("/{id}/decide")
    @Operation(summary = "Approve or reject a registration request")
    @PreAuthorize("hasAnyRole('AIRLINE_ADMINISTRATOR','SALES_AGENT')")
    public ResponseEntity<ApiResponse<ApprovalResponse>> decide(
            @PathVariable Long id, @Valid @RequestBody ApprovalDecisionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Decision recorded", approvalService.decide(id, request)));
    }
}
