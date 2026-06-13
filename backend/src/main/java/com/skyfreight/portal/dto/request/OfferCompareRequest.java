package com.skyfreight.portal.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class OfferCompareRequest {

    @NotEmpty
    private List<Long> ids;
}
