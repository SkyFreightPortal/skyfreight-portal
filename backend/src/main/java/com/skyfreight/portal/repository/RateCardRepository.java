package com.skyfreight.portal.repository;

import com.skyfreight.portal.entity.Offer;
import com.skyfreight.portal.entity.RateCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RateCardRepository extends JpaRepository<RateCard, Long> {

    @Query("""
            SELECT r FROM RateCard r
            WHERE r.originAirport = :origin
              AND r.destinationAirport = :destination
              AND r.serviceType = :serviceType
              AND r.rateType = :rateType
              AND r.active = true
              AND r.validFrom <= :date AND r.validTo >= :date
            ORDER BY r.id DESC
            """)
    List<RateCard> findMatches(
            @Param("origin") String origin,
            @Param("destination") String destination,
            @Param("serviceType") Offer.ServiceType serviceType,
            @Param("rateType") Offer.RateType rateType,
            @Param("date") LocalDate date);
}
