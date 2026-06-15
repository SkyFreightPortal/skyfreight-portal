package com.skyfreight.portal.dto.request;

import com.skyfreight.portal.entity.Order;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderStatusUpdateRequest {

    @NotNull
    private Order.OrderStatus status;
}
