package com.skyfreight.portal.service;

import com.skyfreight.portal.dto.request.ApprovalDecisionRequest;
import com.skyfreight.portal.dto.response.ApprovalResponse;
import com.skyfreight.portal.entity.ApprovalWorkflow;
import com.skyfreight.portal.entity.User;
import com.skyfreight.portal.exception.UserNotFoundException;
import com.skyfreight.portal.repository.ApprovalWorkflowRepository;
import com.skyfreight.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final ApprovalWorkflowRepository approvalWorkflowRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public Page<ApprovalResponse> findByStatus(ApprovalWorkflow.ApprovalStatus status, Pageable pageable) {
        return approvalWorkflowRepository.findByStatus(status, pageable)
                .map(ApprovalResponse::from);
    }

    @Transactional(readOnly = true)
    public long countPending() {
        return approvalWorkflowRepository.countByStatus(ApprovalWorkflow.ApprovalStatus.PENDING);
    }

    @Transactional
    public ApprovalResponse decide(Long approvalId, ApprovalDecisionRequest request) {
        ApprovalWorkflow workflow = approvalWorkflowRepository.findById(approvalId)
                .orElseThrow(() -> new IllegalArgumentException("Approval record not found: " + approvalId));

        if (workflow.getStatus() != ApprovalWorkflow.ApprovalStatus.PENDING) {
            throw new IllegalStateException("This approval has already been processed");
        }

        String reviewerEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User reviewer = userRepository.findByEmail(reviewerEmail)
                .orElseThrow(() -> new UserNotFoundException(reviewerEmail));

        workflow.setStatus(request.getDecision());
        workflow.setReviewedBy(reviewer);
        workflow.setReviewNotes(request.getNotes());
        workflow.setReviewedAt(LocalDateTime.now());
        approvalWorkflowRepository.save(workflow);

        User applicant = workflow.getUser();
        if (request.getDecision() == ApprovalWorkflow.ApprovalStatus.APPROVED) {
            applicant.setStatus(User.UserStatus.ACTIVE);
            userRepository.save(applicant);
            emailService.sendApprovalEmail(applicant);
            log.info("User {} approved by {}", applicant.getEmail(), reviewerEmail);
        } else {
            applicant.setStatus(User.UserStatus.REJECTED);
            userRepository.save(applicant);
            emailService.sendRejectionEmail(applicant, request.getNotes());
            log.info("User {} rejected by {}", applicant.getEmail(), reviewerEmail);
        }

        return ApprovalResponse.from(workflow);
    }
}
