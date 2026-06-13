package com.skyfreight.portal.service;

import com.skyfreight.portal.dto.response.AvailabilityResponse;
import com.skyfreight.portal.dto.response.CalendarPricingResponse;
import com.skyfreight.portal.dto.response.RecommendationResponse;
import com.skyfreight.portal.dto.response.RouteSearchResponse;
import com.skyfreight.portal.entity.Flight;
import com.skyfreight.portal.entity.Offer;
import com.skyfreight.portal.exception.NoRateAvailableException;
import com.skyfreight.portal.repository.FlightRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * Shopping/search layer on top of the Step 2 pricing engine and the flight
 * schedule reference data. Read-only — no capacity is reserved here.
 */
@Service
@RequiredArgsConstructor
public class SearchService {

    private static final int MIN_CONNECTION_MINUTES = 60;
    private static final int CALENDAR_DEFAULT_DAYS = 7;
    private static final BigDecimal CALENDAR_WEIGHT_KG = BigDecimal.valueOf(100);

    private static final Map<String, List<String>> NEARBY_AIRPORTS = Map.of(
            "JFK", List.of("EWR"),
            "EWR", List.of("JFK"),
            "LHR", List.of("LGW"),
            "LGW", List.of("LHR")
    );

    private static final Set<Offer.ServiceType> TEMP_SENSITIVE = Set.of(
            Offer.ServiceType.PHARMA, Offer.ServiceType.PERISHABLE, Offer.ServiceType.LIVE_ANIMALS);

    private static final Set<Offer.ServiceType> GENERAL_PRODUCTS = Set.of(
            Offer.ServiceType.EXPRESS, Offer.ServiceType.GENERAL_CARGO,
            Offer.ServiceType.VALUABLE_CARGO, Offer.ServiceType.PRIORITY);

    private final FlightRepository flightRepository;
    private final RateCalculationService rateCalculationService;

    public RouteSearchResponse searchRoutes(String origin, String destination, LocalDate date,
                                             Offer.ServiceType serviceType, Offer.RateType rateType,
                                             BigDecimal weightKg) {
        RateCalculationService.LanePrice lanePrice = rateCalculationService.quote(
                origin, destination, serviceType, rateType, weightKg, weightKg);

        List<RouteSearchResponse.RouteOption> options = new ArrayList<>();

        flightRepository.findByOriginAirportAndDestinationAirportAndActiveTrue(origin, destination).stream()
                .filter(f -> operatesOn(f, date))
                .forEach(f -> options.add(RouteSearchResponse.RouteOption.builder()
                        .type("DIRECT")
                        .legs(List.of(toLeg(f)))
                        .totalDurationMinutes(f.getDurationMinutes())
                        .totalPrice(lanePrice.totalPrice())
                        .capacityAvailable(lanePrice.capacityAvailable())
                        .build()));

        options.addAll(findConnections(origin, destination, date, lanePrice.totalPrice(), lanePrice.capacityAvailable()));

        List<RouteSearchResponse.RouteOption> sortedOptions = options.stream()
                .sorted(Comparator.comparingInt(RouteSearchResponse.RouteOption::getTotalDurationMinutes))
                .toList();

        return RouteSearchResponse.builder()
                .origin(origin)
                .destination(destination)
                .date(date)
                .serviceType(serviceType)
                .currency(lanePrice.currency())
                .options(sortedOptions)
                .build();
    }

    public AvailabilityResponse getAvailability(String origin, String destination, LocalDate date) {
        List<AvailabilityResponse.FlightAvailability> flights = flightRepository
                .findByOriginAirportAndDestinationAirportAndActiveTrue(origin, destination).stream()
                .filter(f -> operatesOn(f, date))
                .map(f -> {
                    double lf = loadFactor(f.getId(), date);
                    BigDecimal availableCapacity = f.getTotalCapacityKg()
                            .multiply(BigDecimal.valueOf(1 - lf))
                            .setScale(2, RoundingMode.HALF_UP);
                    int availableUld = (int) Math.round(f.getTotalUldPositions() * (1 - lf));
                    return AvailabilityResponse.FlightAvailability.builder()
                            .flightNumber(f.getFlightNumber())
                            .departureTime(f.getDepartureTime())
                            .arrivalTime(f.getArrivalTime())
                            .durationMinutes(f.getDurationMinutes())
                            .aircraftType(f.getAircraftType())
                            .totalCapacityKg(f.getTotalCapacityKg())
                            .availableCapacityKg(availableCapacity)
                            .capacityUtilizationPct(roundPct(lf))
                            .uldType(f.getUldType().name())
                            .totalUldPositions(f.getTotalUldPositions())
                            .availableUldPositions(availableUld)
                            .build();
                })
                .toList();

        List<RouteSearchResponse.RouteOption> connections = findConnections(origin, destination, date, null, false);

        return AvailabilityResponse.builder()
                .origin(origin)
                .destination(destination)
                .date(date)
                .flights(flights)
                .connections(connections)
                .build();
    }

    public CalendarPricingResponse getCalendarPricing(String origin, String destination,
                                                        Offer.ServiceType serviceType, Offer.RateType rateType,
                                                        LocalDate startDate, Integer days) {
        int numDays = (days == null || days <= 0) ? CALENDAR_DEFAULT_DAYS : days;

        RateCalculationService.LanePrice basePrice = rateCalculationService.quote(
                origin, destination, serviceType, rateType, CALENDAR_WEIGHT_KG, CALENDAR_WEIGHT_KG);

        long seed = Objects.hash(origin, destination, serviceType);

        List<Flight> directFlights = flightRepository
                .findByOriginAirportAndDestinationAirportAndActiveTrue(origin, destination);

        record DayCalc(LocalDate date, double loadFactor, BigDecimal price, boolean operatesDirectFlight) {}

        List<DayCalc> calcs = new ArrayList<>();
        for (int i = 0; i < numDays; i++) {
            LocalDate date = startDate.plusDays(i);
            double lf = loadFactor(seed, date);
            BigDecimal price = basePrice.totalPrice()
                    .multiply(BigDecimal.valueOf(0.92 + lf * 0.2))
                    .setScale(2, RoundingMode.HALF_UP);
            boolean operatesDirect = directFlights.stream().anyMatch(f -> operatesOn(f, date));
            calcs.add(new DayCalc(date, lf, price, operatesDirect));
        }

        BigDecimal minPrice = calcs.stream()
                .map(DayCalc::price)
                .min(Comparator.naturalOrder())
                .orElse(null);

        List<CalendarPricingResponse.CalendarDay> days0 = new ArrayList<>();
        LocalDate cheapestDate = null;
        for (DayCalc c : calcs) {
            boolean isCheapest = minPrice != null && c.price().compareTo(minPrice) == 0;
            if (isCheapest && cheapestDate == null) {
                cheapestDate = c.date();
            }
            days0.add(CalendarPricingResponse.CalendarDay.builder()
                    .date(c.date())
                    .dayOfWeek(c.date().getDayOfWeek())
                    .operatesDirectFlight(c.operatesDirectFlight())
                    .price(c.price())
                    .availabilityPct(roundPct(1 - c.loadFactor()))
                    .cheapest(isCheapest)
                    .build());
        }

        List<CalendarPricingResponse.AirportPriceOption> alternativeAirports = buildAlternativeAirports(
                origin, destination, serviceType, rateType, CALENDAR_WEIGHT_KG, basePrice.totalPrice());

        return CalendarPricingResponse.builder()
                .origin(origin)
                .destination(destination)
                .serviceType(serviceType)
                .currency(basePrice.currency())
                .days(days0)
                .cheapestDate(cheapestDate)
                .alternativeAirports(alternativeAirports)
                .build();
    }

    public RecommendationResponse getRecommendations(String origin, String destination,
                                                       Offer.ServiceType serviceType, Offer.RateType rateType,
                                                       BigDecimal weightKg,
                                                       Offer.TemperatureRequirement temperatureRequirement,
                                                       boolean dangerousGoods) {
        RateCalculationService.LanePrice basePrice = rateCalculationService.quote(
                origin, destination, serviceType, rateType, weightKg, weightKg);
        int baseTransitHours = rateCalculationService.estimateTransitHours(serviceType, Offer.TransitPreference.STANDARD);

        Set<Offer.ServiceType> candidates = new LinkedHashSet<>();
        if (!dangerousGoods && serviceType != Offer.ServiceType.DANGEROUS_GOODS) {
            if (temperatureRequirement != Offer.TemperatureRequirement.NONE || TEMP_SENSITIVE.contains(serviceType)) {
                candidates.addAll(TEMP_SENSITIVE);
            } else {
                candidates.addAll(GENERAL_PRODUCTS);
            }
        }
        candidates.remove(serviceType);

        List<RecommendationResponse.ServiceAlternative> alternatives = new ArrayList<>();
        for (Offer.ServiceType candidate : candidates) {
            try {
                RateCalculationService.LanePrice lanePrice = rateCalculationService.quote(
                        origin, destination, candidate, rateType, weightKg, weightKg);
                int transitHours = rateCalculationService.estimateTransitHours(candidate, Offer.TransitPreference.STANDARD);
                BigDecimal savings = basePrice.totalPrice().subtract(lanePrice.totalPrice())
                        .setScale(2, RoundingMode.HALF_UP);
                alternatives.add(RecommendationResponse.ServiceAlternative.builder()
                        .serviceType(candidate)
                        .price(lanePrice.totalPrice())
                        .currency(lanePrice.currency())
                        .transitHours(transitHours)
                        .savings(savings)
                        .build());
            } catch (NoRateAvailableException ignored) {
                // no rate card for this candidate on this lane — not a viable alternative
            }
        }

        List<RecommendationResponse.ServiceAlternative> fasterRoutes = alternatives.stream()
                .filter(a -> a.getTransitHours() < baseTransitHours)
                .sorted(Comparator.comparingInt(RecommendationResponse.ServiceAlternative::getTransitHours))
                .limit(3)
                .toList();

        List<RecommendationResponse.ServiceAlternative> lowerCostRoutes = alternatives.stream()
                .filter(a -> a.getPrice().compareTo(basePrice.totalPrice()) < 0)
                .sorted(Comparator.comparing(RecommendationResponse.ServiceAlternative::getPrice))
                .limit(3)
                .toList();

        List<RecommendationResponse.ServiceAlternative> alternativeProducts = alternatives.stream()
                .sorted(Comparator.comparing(RecommendationResponse.ServiceAlternative::getPrice))
                .limit(3)
                .toList();

        List<CalendarPricingResponse.AirportPriceOption> nearbyAirports = buildAlternativeAirports(
                origin, destination, serviceType, rateType, weightKg, basePrice.totalPrice()).stream()
                .filter(o -> o.getSavings().compareTo(BigDecimal.ZERO) > 0)
                .sorted(Comparator.comparing(CalendarPricingResponse.AirportPriceOption::getSavings).reversed())
                .toList();

        return RecommendationResponse.builder()
                .fasterRoutes(fasterRoutes)
                .lowerCostRoutes(lowerCostRoutes)
                .alternativeProducts(alternativeProducts)
                .nearbyAirports(nearbyAirports)
                .build();
    }

    private List<CalendarPricingResponse.AirportPriceOption> buildAlternativeAirports(
            String origin, String destination, Offer.ServiceType serviceType, Offer.RateType rateType,
            BigDecimal weightKg, BigDecimal basePrice) {
        List<CalendarPricingResponse.AirportPriceOption> options = new ArrayList<>();

        List<String> originAlternatives = new ArrayList<>(NEARBY_AIRPORTS.getOrDefault(origin, List.of()));
        originAlternatives.add(origin);
        List<String> destinationAlternatives = new ArrayList<>(NEARBY_AIRPORTS.getOrDefault(destination, List.of()));
        destinationAlternatives.add(destination);

        for (String altOrigin : originAlternatives) {
            for (String altDestination : destinationAlternatives) {
                if (altOrigin.equals(origin) && altDestination.equals(destination)) {
                    continue;
                }
                try {
                    RateCalculationService.LanePrice lanePrice = rateCalculationService.quote(
                            altOrigin, altDestination, serviceType, rateType, weightKg, weightKg);
                    BigDecimal savings = basePrice.subtract(lanePrice.totalPrice())
                            .setScale(2, RoundingMode.HALF_UP);
                    options.add(CalendarPricingResponse.AirportPriceOption.builder()
                            .originAirport(altOrigin)
                            .destinationAirport(altDestination)
                            .price(lanePrice.totalPrice())
                            .savings(savings)
                            .currency(lanePrice.currency())
                            .build());
                } catch (NoRateAvailableException ignored) {
                    // no rate card for this alternate-airport pair — skip
                }
            }
        }
        return options;
    }

    private List<RouteSearchResponse.RouteOption> findConnections(String origin, String destination, LocalDate date,
                                                                    BigDecimal totalPrice, boolean capacityAvailable) {
        List<RouteSearchResponse.RouteOption> connections = new ArrayList<>();

        List<Flight> firstLegs = flightRepository.findByOriginAirportAndActiveTrue(origin).stream()
                .filter(f -> operatesOn(f, date))
                .filter(f -> !f.getDestinationAirport().equals(destination))
                .toList();

        for (Flight legA : firstLegs) {
            String hub = legA.getDestinationAirport();
            List<Flight> secondLegs = flightRepository
                    .findByOriginAirportAndDestinationAirportAndActiveTrue(hub, destination).stream()
                    .filter(f -> operatesOn(f, date))
                    .toList();

            for (Flight legB : secondLegs) {
                int arrivalMinutes = legA.getArrivalTime().toSecondOfDay() / 60;
                int departureMinutes = legB.getDepartureTime().toSecondOfDay() / 60;
                int layoverMinutes = departureMinutes - arrivalMinutes;
                if (layoverMinutes < MIN_CONNECTION_MINUTES) {
                    continue;
                }
                connections.add(RouteSearchResponse.RouteOption.builder()
                        .type("CONNECTION")
                        .legs(List.of(toLeg(legA), toLeg(legB)))
                        .totalDurationMinutes(legA.getDurationMinutes() + layoverMinutes + legB.getDurationMinutes())
                        .connectionAirport(hub)
                        .layoverMinutes(layoverMinutes)
                        .totalPrice(totalPrice)
                        .capacityAvailable(capacityAvailable)
                        .build());
            }
        }
        return connections;
    }

    private RouteSearchResponse.FlightLeg toLeg(Flight flight) {
        return RouteSearchResponse.FlightLeg.builder()
                .flightNumber(flight.getFlightNumber())
                .origin(flight.getOriginAirport())
                .destination(flight.getDestinationAirport())
                .departureTime(flight.getDepartureTime())
                .arrivalTime(flight.getArrivalTime())
                .durationMinutes(flight.getDurationMinutes())
                .aircraftType(flight.getAircraftType())
                .build();
    }

    private boolean operatesOn(Flight flight, LocalDate date) {
        int isoDayOfWeek = date.getDayOfWeek().getValue();
        return flight.getDaysOfWeek().contains(String.valueOf(isoDayOfWeek));
    }

    /**
     * Deterministic pseudo-random "load factor" in [0.35, 0.90] derived from a seed and
     * date, so availability/pricing vary by date without a real booking ledger. Uses the
     * MurmurHash3 finalizer to spread small (seed, epochDay) deltas across the full range —
     * a plain Objects.hash() leaves adjacent days within rounding distance of each other.
     */
    private double loadFactor(long seed, LocalDate date) {
        long h = seed * 1_000_003L + date.toEpochDay();
        h ^= (h >>> 33);
        h *= 0xff51afd7ed558ccdL;
        h ^= (h >>> 33);
        h *= 0xc4ceb9fe1a85ec53L;
        h ^= (h >>> 33);
        double normalized = (double) (h & Long.MAX_VALUE) / Long.MAX_VALUE;
        return 0.35 + normalized * 0.55;
    }

    private double roundPct(double loadFactor) {
        return Math.round(loadFactor * 1000) / 10.0;
    }
}
