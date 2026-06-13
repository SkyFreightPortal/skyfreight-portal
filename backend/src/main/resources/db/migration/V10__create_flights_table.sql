CREATE TABLE flights (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    flight_number        VARCHAR(10)  NOT NULL,
    origin_airport       VARCHAR(3)   NOT NULL,
    destination_airport  VARCHAR(3)   NOT NULL,
    departure_time       TIME         NOT NULL,
    arrival_time         TIME         NOT NULL,
    duration_minutes     INT          NOT NULL,
    days_of_week         VARCHAR(7)   NOT NULL,
    aircraft_type        VARCHAR(50)  NOT NULL,
    total_capacity_kg    DECIMAL(10,2) NOT NULL,
    uld_type             VARCHAR(10)  NOT NULL,
    total_uld_positions  INT          NOT NULL,
    active               BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_flight_route (origin_airport, destination_airport)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Direct legs covering every existing rate-card lane (both directions)
INSERT INTO flights
    (flight_number, origin_airport, destination_airport, departure_time, arrival_time,
     duration_minutes, days_of_week, aircraft_type, total_capacity_kg, uld_type, total_uld_positions, active)
VALUES
    ('SF101','JFK','LHR','22:00:00','09:30:00', 450, '1234567', 'Boeing 777F', 95000.00, 'AKE', 30, TRUE),
    ('SF102','LHR','JFK','12:00:00','15:00:00', 480, '1234567', 'Boeing 777F', 95000.00, 'AKE', 30, TRUE),
    ('SF201','LAX','NRT','23:30:00','04:00:00', 660, '1357',    'Boeing 777F', 90000.00, 'AKH', 25, TRUE),
    ('SF202','NRT','LAX','17:00:00','10:00:00', 600, '1357',    'Boeing 777F', 90000.00, 'AKH', 25, TRUE),
    ('SF301','ORD','FRA','18:00:00','08:00:00', 480, '1234567', 'Boeing 767F', 60000.00, 'PMC', 20, TRUE),
    ('SF302','FRA','ORD','11:00:00','14:00:00', 540, '1234567', 'Boeing 767F', 60000.00, 'PMC', 20, TRUE),
    ('SF401','DXB','SIN','02:00:00','11:30:00', 510, '246',     'Airbus A330F', 65000.00, 'PMC', 18, TRUE),
    ('SF402','SIN','DXB','14:00:00','19:30:00', 450, '246',     'Airbus A330F', 65000.00, 'PMC', 18, TRUE),
    ('SF501','SFO','HKG','01:00:00','06:30:00', 870, '1234567', 'Boeing 777F', 100000.00, 'AKH', 32, TRUE),
    ('SF502','HKG','SFO','09:00:00','08:00:00', 840, '1234567', 'Boeing 777F', 100000.00, 'AKH', 32, TRUE);

-- Hub connection legs for JFK <-> LHR via ORD (1-stop connection option)
INSERT INTO flights
    (flight_number, origin_airport, destination_airport, departure_time, arrival_time,
     duration_minutes, days_of_week, aircraft_type, total_capacity_kg, uld_type, total_uld_positions, active)
VALUES
    ('SF110','JFK','ORD','08:00:00','10:30:00', 150, '1234567', 'Boeing 767F', 55000.00, 'PMC', 16, TRUE),
    ('SF111','ORD','LHR','13:00:00','02:00:00', 480, '1234567', 'Boeing 777F', 85000.00, 'AKE', 28, TRUE);

-- Alternate-airport legs (EWR near JFK, LGW near LHR) for "nearby airport" recommendations
INSERT INTO flights
    (flight_number, origin_airport, destination_airport, departure_time, arrival_time,
     duration_minutes, days_of_week, aircraft_type, total_capacity_kg, uld_type, total_uld_positions, active)
VALUES
    ('SF120','EWR','LHR','21:30:00','09:00:00', 450, '1234567', 'Boeing 767F', 70000.00, 'AKE', 24, TRUE),
    ('SF121','LHR','EWR','11:30:00','14:30:00', 480, '1234567', 'Boeing 767F', 70000.00, 'AKE', 24, TRUE),
    ('SF130','JFK','LGW','23:00:00','10:30:00', 450, '1234567', 'Boeing 767F', 70000.00, 'AKE', 24, TRUE),
    ('SF131','LGW','JFK','13:00:00','16:00:00', 480, '1234567', 'Boeing 767F', 70000.00, 'AKE', 24, TRUE);

-- Matching rate cards for the alternate-airport lanes (slightly cheaper than JFK-LHR
-- so "nearby airport" recommendations have real savings to surface)
INSERT INTO rate_cards
    (origin_airport, destination_airport, service_type, rate_type, currency,
     rate_per_kg, minimum_charge, fuel_surcharge_pct, security_surcharge, screening_fee,
     terminal_handling_fee, customs_fee, available_capacity_kg, season_start, season_end,
     valid_from, valid_to, active)
VALUES
    ('EWR','LHR','GENERAL_CARGO','PUBLISHED','USD', 3.10, 44.00, 18.50, 12.00, 8.00, 35.00, 20.00, 4800.00, NULL, NULL, '2025-01-01','2026-12-31', TRUE),
    ('EWR','LHR','EXPRESS',      'PUBLISHED','USD', 5.60, 58.00, 18.50, 15.00, 10.00,45.00, 25.00, 1400.00, NULL, NULL, '2025-01-01','2026-12-31', TRUE),
    ('JFK','LGW','GENERAL_CARGO','PUBLISHED','USD', 3.05, 43.00, 18.50, 12.00, 8.00, 35.00, 20.00, 4700.00, NULL, NULL, '2025-01-01','2026-12-31', TRUE),
    ('JFK','LGW','EXPRESS',      'PUBLISHED','USD', 5.50, 57.00, 18.50, 15.00, 10.00,45.00, 25.00, 1350.00, NULL, NULL, '2025-01-01','2026-12-31', TRUE);
