package com.skyfreight.portal.controller;

import com.skyfreight.portal.dto.request.UserUpdateRequest;
import com.skyfreight.portal.dto.response.ApiResponse;
import com.skyfreight.portal.dto.response.UserResponse;
import com.skyfreight.portal.entity.User;
import com.skyfreight.portal.service.UserService;
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
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Manage portal users and role assignments")
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "List all users with optional filters and pagination")
    @PreAuthorize("hasAnyRole('AIRLINE_ADMINISTRATOR','CUSTOMER_ADMIN','SALES_AGENT')")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> listUsers(
            @RequestParam(required = false) User.UserStatus status,
            @RequestParam(required = false) User.AccountType accountType,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<UserResponse> result = userService.findAll(status, accountType, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user details by ID")
    @PreAuthorize("hasAnyRole('AIRLINE_ADMINISTRATOR','CUSTOMER_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.findById(id)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user profile details")
    @PreAuthorize("hasRole('AIRLINE_ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id, @Valid @RequestBody UserUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("User updated", userService.update(id, request)));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Activate or suspend a user account")
    @PreAuthorize("hasRole('AIRLINE_ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<UserResponse>> updateStatus(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        User.UserStatus newStatus = User.UserStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(ApiResponse.success("Status updated", userService.updateStatus(id, newStatus)));
    }

    @PostMapping("/{userId}/roles/{roleId}")
    @Operation(summary = "Assign a role to a user")
    @PreAuthorize("hasRole('AIRLINE_ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<UserResponse>> assignRole(
            @PathVariable Long userId, @PathVariable Long roleId) {
        return ResponseEntity.ok(ApiResponse.success("Role assigned", userService.assignRole(userId, roleId)));
    }

    @DeleteMapping("/{userId}/roles/{roleId}")
    @Operation(summary = "Revoke a role from a user")
    @PreAuthorize("hasRole('AIRLINE_ADMINISTRATOR')")
    public ResponseEntity<ApiResponse<UserResponse>> revokeRole(
            @PathVariable Long userId, @PathVariable Long roleId) {
        return ResponseEntity.ok(ApiResponse.success("Role revoked", userService.revokeRole(userId, roleId)));
    }
}
