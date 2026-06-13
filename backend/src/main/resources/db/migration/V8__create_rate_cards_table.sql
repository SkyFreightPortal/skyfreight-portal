CREATE TABLE rate_cards (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    origin_airport        VARCHAR(3)    NOT NULL,
    destination_airport   VARCHAR(3)    NOT NULL,
    service_type          VARCHAR(30)   NOT NULL,
    rate_type             VARCHAR(20)   NOT NULL,
    currency              VARCHAR(3)    NOT NULL DEFAULT 'USD',
    rate_per_kg           DECIMAL(10,2) NOT NULL,
    minimum_charge        DECIMAL(10,2) NOT NULL,
    fuel_surcharge_pct    DECIMAL(5,2)  NOT NULL DEFAULT 0,
    security_surcharge    DECIMAL(10,2) NOT NULL DEFAULT 0,
    screening_fee         DECIMAL(10,2) NOT NULL DEFAULT 0,
    terminal_handling_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    customs_fee           DECIMAL(10,2) NOT NULL DEFAULT 0,
    available_capacity_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
    season_start          DATE          NULL,
    season_end            DATE          NULL,
    valid_from            DATE          NOT NULL,
    valid_to              DATE          NOT NULL,
    active                BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rate_lane (origin_airport, destination_airport, service_type, rate_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed reference rate cards covering each service type and a spread of rate types
INSERT INTO rate_cards
    (origin_airport, destination_airport, service_type, rate_type, currency,
     rate_per_kg, minimum_charge, fuel_surcharge_pct, security_surcharge, screening_fee,
     terminal_handling_fee, customs_fee, available_capacity_kg, season_start, season_end,
     valid_from, valid_to, active)
VALUES
    ('JFK','LHR','GENERAL_CARGO',   'PUBLISHED', 'USD', 3.20,  45.00, 18.50, 12.00, 8.00,  35.00, 20.00, 5000.00, NULL,         NULL,         '2025-01-01','2026-12-31', TRUE),
    ('JFK','LHR','EXPRESS',         'PUBLISHED', 'USD', 5.75,  60.00, 18.50, 15.00, 10.00, 45.00, 25.00, 1500.00, NULL,         NULL,         '2025-01-01','2026-12-31', TRUE),
    ('JFK','LHR','PHARMA',          'CONTRACT',  'USD', 6.40,  85.00, 18.50, 20.00, 18.00, 55.00, 30.00, 800.00,  NULL,         NULL,         '2025-01-01','2026-12-31', TRUE),
    ('JFK','LHR','LIVE_ANIMALS',    'PUBLISHED', 'USD', 7.10,  120.00,18.50, 25.00, 15.00, 60.00, 30.00, 400.00,  NULL,         NULL,         '2025-01-01','2026-12-31', TRUE),
    ('LAX','NRT','GENERAL_CARGO',   'PUBLISHED', 'USD', 3.85,  50.00, 21.00, 14.00, 9.00,  38.00, 22.00, 6000.00, NULL,         NULL,         '2025-01-01','2026-12-31', TRUE),
    ('LAX','NRT','PERISHABLE',      'SPOT',      'USD', 4.95,  70.00, 21.00, 16.00, 12.00, 42.00, 24.00, 2200.00, NULL,         NULL,         '2025-01-01','2026-12-31', TRUE),
    ('ORD','FRA','GENERAL_CARGO',   'SEASONAL',  'USD', 3.05,  48.00, 19.75, 13.00, 8.50,  36.00, 21.00, 5500.00, '2026-05-01', '2026-09-30', '2025-01-01','2026-12-31', TRUE),
    ('ORD','FRA','PRIORITY',        'DYNAMIC',   'USD', 6.90,  95.00, 19.75, 22.00, 16.00, 50.00, 28.00, 900.00,  NULL,         NULL,         '2025-01-01','2026-12-31', TRUE),
    ('DXB','SIN','DANGEROUS_GOODS', 'PUBLISHED', 'USD', 5.20,  90.00, 17.25, 30.00, 20.00, 55.00, 32.00, 1200.00, NULL,         NULL,         '2025-01-01','2026-12-31', TRUE),
    ('SFO','HKG','VALUABLE_CARGO',  'CONTRACT',  'USD', 8.50,  150.00,20.00, 35.00, 25.00, 65.00, 35.00, 600.00,  NULL,         NULL,         '2025-01-01','2026-12-31', TRUE);
