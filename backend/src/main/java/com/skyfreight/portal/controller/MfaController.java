package com.skyfreight.portal.controller;

import com.skyfreight.portal.dto.response.ApiResponse;
import com.skyfreight.portal.service.MfaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth/mfa")
@RequiredArgsConstructor
@Tag(name = "Multi-Factor Authentication", description = "MFA setup and management")
public class MfaController {

    private final MfaService mfaService;

    @PostMapping("/setup/{userId}")
    @Operation(summary = "Generate MFA QR code for a user")
    public ResponseEntity<ApiResponse<Map<String, String>>> setup(@PathVariable Long userId) {
        Map<String, String> result = mfaService.setupMfa(userId);
        return ResponseEntity.ok(ApiResponse.success("Scan QR code with your authenticator app", result));
    }

    @PostMapping("/enable/{userId}")
    @Operation(summary = "Enable MFA after verifying the first TOTP code")
    public ResponseEntity<ApiResponse<Void>> enable(
            @PathVariable Long userId, @RequestBody Map<String, String> body) {
        mfaService.enableMfa(userId, body.get("totpCode"));
        return ResponseEntity.ok(ApiResponse.success("MFA enabled successfully", null));
    }
}
