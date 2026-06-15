package com.skyfreight.portal.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class OrderCreateRequest {

    @NotNull
    private Long offerId;

    @NotNull
    @FutureOrPresent
    private LocalDate requestedShipDate;

    @Size(max = 500)
    private String specialInstructions;

    @NotNull
    @Valid
    private ShipmentPartyRequest consignor;

    @NotNull
    @Valid
    private ShipmentPartyRequest consignee;

    @Valid
    private ShipmentPartyRequest notifyParty;
}
