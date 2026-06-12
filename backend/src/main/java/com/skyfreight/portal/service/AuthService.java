package com.skyfreight.portal.service;

import com.skyfreight.portal.dto.request.LoginRequest;
import com.skyfreight.portal.dto.request.RegisterRequest;
import com.skyfreight.portal.dto.response.AuthResponse;
import com.skyfreight.portal.dto.response.UserResponse;
import com.skyfreight.portal.entity.*;
import com.skyfreight.portal.exception.DuplicateEmailException;
import com.skyfreight.portal.exception.InvalidTokenException;
import com.skyfreight.portal.exception.UserNotFoundException;
import com.skyfreight.portal.repository.*;
import com.skyfreight.portal.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ApprovalWorkflowRepository approvalWorkflowRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final MfaService mfaService;
    private final EmailService emailService;
    private final AuditLogRepository auditLogRepository;

    @Value("${skyfreight.jwt.refresh-token-expiry-ms}")
    private long refreshTokenExpiryMs;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException(request.getEmail());
        }

        Role defaultRole = roleRepository.findByName(Role.RoleName.CUSTOMER_ADMIN)
                .orElseThrow(() -> new IllegalStateException("Default role not configured"));

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .company(request.getCompany())
                .phone(request.getPhone())
                .accountType(request.getAccountType())
                .status(User.UserStatus.PENDING_APPROVAL)
                .build();
        user.getRoles().add(defaultRole);

        User saved = userRepository.save(user);

        ApprovalWorkflow workflow = ApprovalWorkflow.builder().user(saved).build();
        approvalWorkflowRepository.save(workflow);

        emailService.sendRegistrationPendingEmail(saved);
        logAudit("USER_REGISTERED", saved.getId(), saved.getEmail(), "SUCCESS",
                "Account type: " + request.getAccountType());

        log.info("New user registered: {} ({})", saved.getEmail(), saved.getAccountType());
        return UserResponse.from(saved);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException(request.getEmail()));

        if (user.getStatus() == User.UserStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Your account is pending approval. You will be notified by email.");
        }
        if (user.getStatus() == User.UserStatus.REJECTED) {
            throw new IllegalStateException("Your account registration was not approved. Please contact support.");
        }

        if (user.isMfaEnabled()) {
            return AuthResponse.mfaChallenge(user.getId());
        }

        return issueTokens(user);
    }

    @Transactional
    public AuthResponse verifyMfaAndLogin(Long userId, String totpCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        if (!mfaService.verifyCode(user.getMfaSecret(), totpCode)) {
            logAudit("MFA_FAILED", userId, user.getEmail(), "FAILURE", null);
            throw new InvalidTokenException("Invalid MFA code. Please try again.");
        }

        logAudit("MFA_SUCCESS", userId, user.getEmail(), "SUCCESS", null);
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse refreshToken(String refreshTokenValue) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new InvalidTokenException("Refresh token not found"));

        if (refreshToken.isRevoked() || refreshToken.isExpired()) {
            throw new InvalidTokenException("Refresh token is expired or revoked. Please log in again.");
        }

        User user = refreshToken.getUser();
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        return issueTokens(user);
    }

    @Transactional
    public void logout(String refreshTokenValue) {
        refreshTokenRepository.findByToken(refreshTokenValue)
                .ifPresent(rt -> {
                    rt.setRevoked(true);
                    refreshTokenRepository.save(rt);
                    logAudit("USER_LOGOUT", rt.getUser().getId(), rt.getUser().getEmail(), "SUCCESS", null);
                });
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(user.getEmail(), user.getId());

        String rawRefresh = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .token(rawRefresh)
                .user(user)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiryMs / 1000))
                .build();
        refreshTokenRepository.save(refreshToken);

        user.setLastLoginAt(LocalDateTime.now());
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        logAudit("USER_LOGIN", user.getId(), user.getEmail(), "SUCCESS", null);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefresh)
                .tokenType("Bearer")
                .expiresIn(900)
                .mfaRequired(false)
                .user(UserResponse.from(user))
                .build();
    }

    private void logAudit(String action, Long userId, String email, String outcome, String details) {
        auditLogRepository.save(AuditLog.builder()
                .action(action).userId(userId).userEmail(email)
                .outcome(outcome).details(details).build());
    }
}
