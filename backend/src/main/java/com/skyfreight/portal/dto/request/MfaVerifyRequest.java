package com.skyfreight.portal.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MfaVerifyRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "TOTP code is required")
    private String totpCode;
}
