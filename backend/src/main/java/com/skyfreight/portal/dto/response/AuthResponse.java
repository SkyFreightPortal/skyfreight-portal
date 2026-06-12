package com.skyfreight.portal.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private long expiresIn;
    private boolean mfaRequired;
    private Long userId;
    private UserResponse user;

    public static AuthResponse mfaChallenge(Long userId) {
        return AuthResponse.builder()
                .mfaRequired(true)
                .userId(userId)
                .tokenType("Bearer")
                .build();
    }
}
