package com.skyfreight.portal.service;

import com.skyfreight.portal.dto.request.OrderCreateRequest;
import com.skyfreight.portal.dto.request.ShipmentPartyRequest;
import com.skyfreight.portal.dto.response.OrderResponse;
import com.skyfreight.portal.entity.Offer;
import com.skyfreight.portal.entity.Order;
import com.skyfreight.portal.entity.OrderAncillaryService;
import com.skyfreight.portal.entity.ShipmentParty;
import com.skyfreight.portal.entity.User;
import com.skyfreight.portal.exception.OfferNotFoundException;
import com.skyfreight.portal.exception.OrderNotFoundException;
import com.skyfreight.portal.exception.UserNotFoundException;
import com.skyfreight.portal.repository.OfferRepository;
import com.skyfreight.portal.repository.OrderRepository;
import com.skyfreight.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private static final Map<Order.OrderStatus, Set<Order.OrderStatus>> ALLOWED_TRANSITIONS = Map.of(
            Order.OrderStatus.CREATED, Set.of(Order.OrderStatus.CONFIRMED, Order.OrderStatus.CANCELLED),
            Order.OrderStatus.CONFIRMED, Set.of(Order.OrderStatus.IN_TRANSIT, Order.OrderStatus.CANCELLED),
            Order.OrderStatus.IN_TRANSIT, Set.of(Order.OrderStatus.DELIVERED)
    );

    private final OrderRepository orderRepository;
    private final OfferRepository offerRepository;
    private final UserRepository userRepository;

    @Transactional
    public OrderResponse create(OrderCreateRequest request) {
        Offer offer = offerRepository.findById(request.getOfferId())
                .orElseThrow(() -> new OfferNotFoundException(request.getOfferId()));

        if (offer.getStatus() != Offer.OfferStatus.ACCEPTED) {
            throw new IllegalStateException(
                    "Only accepted offers can be converted to an order (offer status: " + offer.getStatus() + ")");
        }
        if (orderRepository.existsByOfferId(offer.getId())) {
            throw new IllegalStateException(
                    "Offer " + offer.getOfferNumber() + " has already been converted to an order");
        }

        Order order = Order.builder()
                .offer(offer)
                .customer(offer.getCustomer())
                .createdBy(currentUser())
                .originAirport(offer.getOriginAirport())
                .destinationAirport(offer.getDestinationAirport())
                .serviceType(offer.getServiceType())
                .commodity(offer.getCommodity())
                .chargeableWeightKg(offer.getChargeableWeightKg())
                .requestedCapacityKg(offer.getRequestedCapacityKg())
                .currency(offer.getCurrency())
                .totalPrice(offer.getTotalPrice())
                .requestedShipDate(request.getRequestedShipDate())
                .specialInstructions(request.getSpecialInstructions())
                .consignor(toParty(request.getConsignor()))
                .consignee(toParty(request.getConsignee()))
                .notifyParty(request.getNotifyParty() != null ? toParty(request.getNotifyParty()) : new ShipmentParty())
                .status(Order.OrderStatus.CREATED)
                .build();

        offer.getAncillaryServices().forEach(line -> order.getAncillaryServices().add(
                OrderAncillaryService.builder()
                        .order(order)
                        .serviceType(line.getServiceType())
                        .price(line.getPrice())
                        .notes(line.getNotes())
                        .build()));

        Order saved = persistWithOrderNumber(order);
        log.info("Order {} created from offer {} for customer {}",
                saved.getOrderNumber(), offer.getOfferNumber(), offer.getCustomer().getEmail());
        return OrderResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> findAll(Order.OrderStatus status, String originAirport, String destinationAirport,
                                        Offer.ServiceType serviceType, String search, Pageable pageable) {
        return orderRepository.findAllWithFilters(status, originAirport, destinationAirport, serviceType, search, pageable)
                .map(OrderResponse::from);
    }

    @Transactional(readOnly = true)
    public OrderResponse findById(Long id) {
        return orderRepository.findById(id)
                .map(OrderResponse::from)
                .orElseThrow(() -> new OrderNotFoundException(id));
    }

    @Transactional
    public OrderResponse updateStatus(Long id, Order.OrderStatus newStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));

        Set<Order.OrderStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(order.getStatus(), Set.of());
        if (!allowed.contains(newStatus)) {
            throw new IllegalStateException(
                    "Cannot change order status from " + order.getStatus() + " to " + newStatus);
        }

        order.setStatus(newStatus);
        log.info("Order {} status changed to {}", order.getOrderNumber(), newStatus);
        return OrderResponse.from(orderRepository.save(order));
    }

    private Order persistWithOrderNumber(Order order) {
        Order saved = orderRepository.save(order);
        saved.setOrderNumber(String.format("ORD-%d-%06d", saved.getCreatedAt().getYear(), saved.getId()));
        return orderRepository.save(saved);
    }

    private ShipmentParty toParty(ShipmentPartyRequest request) {
        return ShipmentParty.builder()
                .name(request.getName())
                .company(request.getCompany())
                .addressLine1(request.getAddressLine1())
                .addressLine2(request.getAddressLine2())
                .city(request.getCity())
                .stateProvince(request.getStateProvince())
                .postalCode(request.getPostalCode())
                .country(request.getCountry())
                .phone(request.getPhone())
                .email(request.getEmail())
                .build();
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException(email));
    }
}
