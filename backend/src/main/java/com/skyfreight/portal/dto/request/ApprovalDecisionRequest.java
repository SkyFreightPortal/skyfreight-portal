package com.skyfreight.portal.dto.request;

import com.skyfreight.portal.entity.ApprovalWorkflow;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ApprovalDecisionRequest {

    @NotNull(message = "Decision is required")
    private ApprovalWorkflow.ApprovalStatus decision;

    private String notes;
}
