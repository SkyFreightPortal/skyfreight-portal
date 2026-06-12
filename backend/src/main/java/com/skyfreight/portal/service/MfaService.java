package com.skyfreight.portal.service;

import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import com.warrenstrange.googleauth.GoogleAuthenticatorQRGenerator;
import com.skyfreight.portal.entity.User;
import com.skyfreight.portal.exception.UserNotFoundException;
import com.skyfreight.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class MfaService {

    private final UserRepository userRepository;
    private final GoogleAuthenticator googleAuthenticator;

    @Value("${skyfreight.app.name}")
    private String appName;

    @Transactional
    public Map<String, String> setupMfa(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        GoogleAuthenticatorKey credentials = googleAuthenticator.createCredentials();
        String secret = credentials.getKey();
        String qrUrl = GoogleAuthenticatorQRGenerator.getOtpAuthTotpURL(
                appName, user.getEmail(), credentials);

        user.setMfaSecret(secret);
        userRepository.save(user);

        return Map.of("secret", secret, "qrCodeUrl", qrUrl);
    }

    @Transactional
    public void enableMfa(Long userId, String totpCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        if (!verifyCode(user.getMfaSecret(), totpCode)) {
            throw new IllegalStateException("Invalid MFA code. MFA setup failed.");
        }

        user.setMfaEnabled(true);
        userRepository.save(user);
    }

    public boolean verifyCode(String secret, String code) {
        try {
            return googleAuthenticator.authorize(secret, Integer.parseInt(code));
        } catch (NumberFormatException e) {
            return false;
        }
    }
}
