package com.skyfreight.portal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders", indexes = {
        @Index(name = "idx_order_status", columnList = "status"),
        @Index(name = "idx_order_customer", columnList = "customer_id")
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 20)
    private String orderNumber;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offer_id", nullable = false, unique = true)
    private Offer offer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @Column(nullable = false, length = 3)
    private String originAirport;

    @Column(nullable = false, length = 3)
    private String destinationAirport;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(30)")
    private Offer.ServiceType serviceType;

    @Column(nullable = false, length = 150)
    private String commodity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal chargeableWeightKg;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal requestedCapacityKg;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Column(nullable = false)
    private LocalDate requestedShipDate;

    @Column(length = 500)
    private String specialInstructions;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "name", column = @Column(name = "consignor_name", nullable = false, length = 150)),
            @AttributeOverride(name = "company", column = @Column(name = "consignor_company", nullable = false, length = 150)),
            @AttributeOverride(name = "addressLine1", column = @Column(name = "consignor_address_line1", nullable = false, length = 200)),
            @AttributeOverride(name = "addressLine2", column = @Column(name = "consignor_address_line2", length = 200)),
            @AttributeOverride(name = "city", column = @Column(name = "consignor_city", nullable = false, length = 100)),
            @AttributeOverride(name = "stateProvince", column = @Column(name = "consignor_state_province", length = 100)),
            @AttributeOverride(name = "postalCode", column = @Column(name = "consignor_postal_code", length = 20)),
            @AttributeOverride(name = "country", column = @Column(name = "consignor_country", nullable = false, length = 100)),
            @AttributeOverride(name = "phone", column = @Column(name = "consignor_phone", nullable = false, length = 30)),
            @AttributeOverride(name = "email", column = @Column(name = "consignor_email", length = 150))
    })
    private ShipmentParty consignor;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "name", column = @Column(name = "consignee_name", nullable = false, length = 150)),
            @AttributeOverride(name = "company", column = @Column(name = "consignee_company", nullable = false, length = 150)),
            @AttributeOverride(name = "addressLine1", column = @Column(name = "consignee_address_line1", nullable = false, length = 200)),
            @AttributeOverride(name = "addressLine2", column = @Column(name = "consignee_address_line2", length = 200)),
            @AttributeOverride(name = "city", column = @Column(name = "consignee_city", nullable = false, length = 100)),
            @AttributeOverride(name = "stateProvince", column = @Column(name = "consignee_state_province", length = 100)),
            @AttributeOverride(name = "postalCode", column = @Column(name = "consignee_postal_code", length = 20)),
            @AttributeOverride(name = "country", column = @Column(name = "consignee_country", nullable = false, length = 100)),
            @AttributeOverride(name = "phone", column = @Column(name = "consignee_phone", nullable = false, length = 30)),
            @AttributeOverride(name = "email", column = @Column(name = "consignee_email", length = 150))
    })
    private ShipmentParty consignee;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "name", column = @Column(name = "notify_party_name", length = 150)),
            @AttributeOverride(name = "company", column = @Column(name = "notify_party_company", length = 150)),
            @AttributeOverride(name = "addressLine1", column = @Column(name = "notify_party_address_line1", length = 200)),
            @AttributeOverride(name = "addressLine2", column = @Column(name = "notify_party_address_line2", length = 200)),
            @AttributeOverride(name = "city", column = @Column(name = "notify_party_city", length = 100)),
            @AttributeOverride(name = "stateProvince", column = @Column(name = "notify_party_state_province", length = 100)),
            @AttributeOverride(name = "postalCode", column = @Column(name = "notify_party_postal_code", length = 20)),
            @AttributeOverride(name = "country", column = @Column(name = "notify_party_country", length = 100)),
            @AttributeOverride(name = "phone", column = @Column(name = "notify_party_phone", length = 30)),
            @AttributeOverride(name = "email", column = @Column(name = "notify_party_email", length = 150))
    })
    private ShipmentParty notifyParty;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(20)")
    @Builder.Default
    private OrderStatus status = OrderStatus.CREATED;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<OrderAncillaryService> ancillaryServices = new ArrayList<>();

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public enum OrderStatus {
        CREATED,
        CONFIRMED,
        IN_TRANSIT,
        DELIVERED,
        CANCELLED
    }
}
