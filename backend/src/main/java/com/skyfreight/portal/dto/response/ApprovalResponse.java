package com.skyfreight.portal.dto.response;

import com.skyfreight.portal.entity.ApprovalWorkflow;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ApprovalResponse {

    private Long id;
    private UserResponse user;
    private ApprovalWorkflow.ApprovalStatus status;
    private String reviewedBy;
    private String reviewNotes;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;

    public static ApprovalResponse from(ApprovalWorkflow workflow) {
        return ApprovalResponse.builder()
                .id(workflow.getId())
                .user(UserResponse.from(workflow.getUser()))
                .status(workflow.getStatus())
                .reviewedBy(workflow.getReviewedBy() != null
                        ? workflow.getReviewedBy().getFullName() : null)
                .reviewNotes(workflow.getReviewNotes())
                .reviewedAt(workflow.getReviewedAt())
                .createdAt(workflow.getCreatedAt())
                .build();
    }
}
