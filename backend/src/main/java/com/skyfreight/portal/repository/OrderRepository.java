package com.skyfreight.portal.repository;

import com.skyfreight.portal.entity.Offer;
import com.skyfreight.portal.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    boolean existsByOfferId(Long offerId);

    Optional<Order> findByOfferId(Long offerId);

    @Query("""
            SELECT o FROM Order o
            WHERE (:status IS NULL OR o.status = :status)
              AND (:originAirport IS NULL OR o.originAirport = :originAirport)
              AND (:destinationAirport IS NULL OR o.destinationAirport = :destinationAirport)
              AND (:serviceType IS NULL OR o.serviceType = :serviceType)
              AND (:search IS NULL OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%',:search,'%'))
                   OR LOWER(o.commodity) LIKE LOWER(CONCAT('%',:search,'%'))
                   OR LOWER(o.customer.email) LIKE LOWER(CONCAT('%',:search,'%'))
                   OR LOWER(o.customer.company) LIKE LOWER(CONCAT('%',:search,'%')))
            """)
    Page<Order> findAllWithFilters(
            @Param("status") Order.OrderStatus status,
            @Param("originAirport") String originAirport,
            @Param("destinationAirport") String destinationAirport,
            @Param("serviceType") Offer.ServiceType serviceType,
            @Param("search") String search,
            Pageable pageable);
}
