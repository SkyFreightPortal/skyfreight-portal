# Sequence Diagrams

## Login + MFA Authentication Flow

Covers `POST /auth/login` and `POST /auth/mfa/verify`, as implemented in
`AuthController`, `AuthService`, and `MfaService`.

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend (LoginPage / MfaPage)
    participant Auth as AuthController
    participant AuthSvc as AuthService
    participant AM as AuthenticationManager
    participant DB as MySQL
    participant MfaSvc as MfaService
    participant Audit as AuditLogRepository

    User->>FE: Enter email + password
    FE->>Auth: POST /auth/login {email, password}
    Auth->>AuthSvc: login(request)
    AuthSvc->>AM: authenticate(email, password)
    AM->>DB: load user by email, verify password hash
    AM-->>AuthSvc: Authentication OK (or AuthenticationException)

    alt invalid credentials
        AuthSvc-->>Auth: throws AuthenticationException
        Auth-->>FE: 401 Unauthorized
        FE-->>User: Show "Invalid email or password"
    else account PENDING_APPROVAL or REJECTED
        AuthSvc-->>Auth: throws IllegalStateException
        Auth-->>FE: 400/409 error response
        FE-->>User: Show account status message
    else credentials valid
        AuthSvc->>DB: findByEmail(email)

        alt user.mfaEnabled == true
            AuthSvc-->>Auth: AuthResponse.mfaChallenge(userId)\n{ mfaRequired: true, userId }
            Auth-->>FE: 200 OK { mfaRequired: true, userId }
            FE->>FE: navigate to /mfa
            FE-->>User: Show "Enter 6-digit code"

            User->>FE: Enter TOTP code
            FE->>Auth: POST /auth/mfa/verify {userId, totpCode}
            Auth->>AuthSvc: verifyMfaAndLogin(userId, totpCode)
            AuthSvc->>DB: findById(userId) (load mfaSecret)
            AuthSvc->>MfaSvc: verifyCode(mfaSecret, totpCode)
            MfaSvc->>MfaSvc: GoogleAuthenticator.authorize(secret, code)

            alt code invalid
                MfaSvc-->>AuthSvc: false
                AuthSvc->>Audit: log("MFA_FAILED", userId, FAILURE)
                AuthSvc-->>Auth: throws InvalidTokenException
                Auth-->>FE: 401 "Invalid MFA code"
                FE-->>User: Show error, stay on /mfa
            else code valid
                MfaSvc-->>AuthSvc: true
                AuthSvc->>Audit: log("MFA_SUCCESS", userId, SUCCESS)
                AuthSvc->>AuthSvc: issueTokens(user)
            end
        else MFA not enabled
            AuthSvc->>AuthSvc: issueTokens(user)
        end
    end

    Note over AuthSvc,DB: issueTokens(user)
    AuthSvc->>AuthSvc: generate JWT access token (15 min expiry)
    AuthSvc->>AuthSvc: generate random refresh token (UUID)
    AuthSvc->>DB: save RefreshToken {token, user, expiresAt}
    AuthSvc->>DB: update user.lastLoginAt, failedLoginAttempts = 0
    AuthSvc->>Audit: log("USER_LOGIN", userId, SUCCESS)
    AuthSvc-->>Auth: AuthResponse {accessToken, refreshToken, tokenType, expiresIn, user}
    Auth-->>FE: 200 OK { accessToken, refreshToken, user }
    FE->>FE: store tokens, navigate to /dashboard
    FE-->>User: Show dashboard
```

### Notes
- The login endpoint returns `mfaRequired: true` with only a `userId` (no
  tokens) when the user has MFA enabled; tokens are issued only after
  `/auth/mfa/verify` succeeds.
- `issueTokens` is shared by the non-MFA login path, the MFA-verified path,
  and `POST /auth/refresh`.
- Every login attempt outcome (success, MFA failure/success, logout) is
  written to `AuditLog` via `AuditLogRepository`.
