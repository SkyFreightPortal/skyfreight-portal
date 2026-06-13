package com.skyfreight.portal.repository;

import com.skyfreight.portal.entity.Flight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlightRepository extends JpaRepository<Flight, Long> {

    List<Flight> findByOriginAirportAndDestinationAirportAndActiveTrue(String originAirport, String destinationAirport);

    List<Flight> findByOriginAirportAndActiveTrue(String originAirport);

    List<Flight> findByDestinationAirportAndActiveTrue(String destinationAirport);
}
