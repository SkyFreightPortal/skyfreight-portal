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

---

## Offer Creation & Pricing Flow

Covers `POST /offers`, as implemented in `OfferController`, `OfferService`,
and `RateCalculationService`.

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend (OfferCreatePage)
    participant Offer as OfferController
    participant OfferSvc as OfferService
    participant RateSvc as RateCalculationService
    participant DB as MySQL

    User->>FE: Enter route, commodity, weight/dims, service type, ancillaries
    FE->>Offer: POST /offers {OfferCreateRequest}
    Offer->>OfferSvc: create(request)
    OfferSvc->>OfferSvc: compute chargeableWeightKg = max(actual, volumetric)
    OfferSvc->>RateSvc: quote(origin, destination, serviceType, rateType, chargeableWeightKg, requestedCapacityKg)
    RateSvc->>DB: find matching RateCard (route + serviceType + rateType)

    alt no rate card found
        RateSvc-->>OfferSvc: throws NoRateAvailableException
        OfferSvc-->>Offer: propagate
        Offer-->>FE: 409 "No rate card available..."
        FE-->>User: Show error
    else rate card found
        RateSvc->>RateSvc: baseCharge = chargeableWeightKg * ratePerKg (min minimumCharge)
        RateSvc->>RateSvc: fuelSurcharge = baseCharge * fuelSurchargePct
        RateSvc->>RateSvc: feesTotal = security + screening + terminal + customs
        RateSvc->>RateSvc: capacityAvailable = requestedCapacityKg <= rateCard.availableCapacityKg
        RateSvc-->>OfferSvc: LanePrice {baseCharge, fuelSurcharge, feesTotal, totalPrice, capacityAvailable}
        OfferSvc->>OfferSvc: add ancillary service charges on top of LanePrice
        OfferSvc->>DB: save Offer + OfferAncillaryService rows (status=ACTIVE, version=1)
        OfferSvc-->>Offer: OfferResponse
        Offer-->>FE: 200 OK {offer}
        FE-->>User: Show priced offer
    end
```

### Notes
- `chargeableWeightKg` is the greater of the actual `weightKg` and the
  volumetric weight derived from `lengthCm * widthCm * heightCm`.
- `RateCalculationService.quote()` returns the lane-level price breakdown
  (`LanePrice`); `calculate()` (used by `OfferService`) wraps `quote()` and
  adds ancillary service charges to produce the full `PricingResult`.
- `POST /offers/{id}/revise` repeats this flow with a new request body, then
  marks the original offer `SUPERSEDED` and links the new offer via
  `parentOfferId` with `version + 1`.

---

## Shopping & Search Flow

Covers `GET /search/routes`, `/availability`, `/calendar`, and
`/recommendations`, as implemented in `SearchController` and `SearchService`.

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend (ShoppingSearchPage)
    participant Search as SearchController
    participant SearchSvc as SearchService
    participant RateSvc as RateCalculationService
    participant DB as MySQL (flights, rate_cards)

    User->>FE: Enter origin, destination, date, product type, weight
    FE->>Search: GET /search/routes, /availability, /calendar, /recommendations (in parallel)

    par Route search
        Search->>SearchSvc: searchRoutes(origin, destination, date, serviceType, rateType, weightKg)
        SearchSvc->>RateSvc: quote(...)
        SearchSvc->>DB: find direct flights operating on date
        SearchSvc->>SearchSvc: findConnections() via hub airports (layover >= 60 min)
        SearchSvc-->>Search: RouteSearchResponse {options sorted by duration}
    and Availability search
        Search->>SearchSvc: getAvailability(origin, destination, date)
        SearchSvc->>DB: find direct flights operating on date
        SearchSvc->>SearchSvc: loadFactor(flight.id, date) -> availableCapacityKg, availableUldPositions
        SearchSvc->>SearchSvc: findConnections() for connection options
        SearchSvc-->>Search: AvailabilityResponse {flights, connections}
    and Calendar pricing
        Search->>SearchSvc: getCalendarPricing(origin, destination, serviceType, rateType, startDate, days)
        SearchSvc->>RateSvc: quote(...) for base price
        loop for each day in range
            SearchSvc->>SearchSvc: loadFactor(seed, date) -> price multiplier & availabilityPct
        end
        SearchSvc->>SearchSvc: mark min-price day as cheapest, build alternativeAirports (NEARBY_AIRPORTS)
        SearchSvc-->>Search: CalendarPricingResponse {days, cheapestDate, alternativeAirports}
    and Recommendations
        Search->>SearchSvc: getRecommendations(origin, destination, serviceType, rateType, weightKg, ...)
        SearchSvc->>RateSvc: quote(...) for base price & candidate service types
        SearchSvc->>SearchSvc: filter candidates by product category (temp-sensitive / general / DG)
        SearchSvc-->>Search: RecommendationResponse {fasterRoutes, lowerCostRoutes, alternativeProducts, nearbyAirports}
    end

    Search-->>FE: 200 OK (each section independently)
    FE-->>User: Render Route Options, Availability, Calendar Pricing, Recommendations
```

### Notes
- All four endpoints are read-only — no capacity is reserved by a search.
- `loadFactor(seed, date)` is a deterministic MurmurHash3-based function in
  `[0.35, 0.90]` that drives date-varying availability and pricing without a
  booking ledger.
- The frontend issues all four requests via `Promise.allSettled`, so a 409
  (no rate card) on `/recommendations` does not block the other sections from
  rendering.
- `NEARBY_AIRPORTS` maps alternate airports for the same metro area
  (`JFK ↔ EWR`, `LHR ↔ LGW`), used by both calendar pricing and
  recommendations to surface cheaper nearby-airport options.
