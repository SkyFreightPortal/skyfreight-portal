package com.skyfreight.portal.repository;

import com.skyfreight.portal.entity.Offer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OfferRepository extends JpaRepository<Offer, Long> {

    @Query("""
            SELECT o FROM Offer o
            WHERE (:status IS NULL OR o.status = :status)
              AND (:originAirport IS NULL OR o.originAirport = :originAirport)
              AND (:destinationAirport IS NULL OR o.destinationAirport = :destinationAirport)
              AND (:serviceType IS NULL OR o.serviceType = :serviceType)
              AND (:search IS NULL OR LOWER(o.offerNumber) LIKE LOWER(CONCAT('%',:search,'%'))
                   OR LOWER(o.commodity) LIKE LOWER(CONCAT('%',:search,'%'))
                   OR LOWER(o.customer.email) LIKE LOWER(CONCAT('%',:search,'%'))
                   OR LOWER(o.customer.company) LIKE LOWER(CONCAT('%',:search,'%')))
            """)
    Page<Offer> findAllWithFilters(
            @Param("status") Offer.OfferStatus status,
            @Param("originAirport") String originAirport,
            @Param("destinationAirport") String destinationAirport,
            @Param("serviceType") Offer.ServiceType serviceType,
            @Param("search") String search,
            Pageable pageable);

    List<Offer> findByIdIn(List<Long> ids);

    @Modifying
    @Query("UPDATE Offer o SET o.status = :newStatus WHERE o.status = :currentStatus AND o.validUntil < :now")
    int expireOffers(
            @Param("currentStatus") Offer.OfferStatus currentStatus,
            @Param("newStatus") Offer.OfferStatus newStatus,
            @Param("now") LocalDateTime now);
}
