package com.skyfreight.portal.repository;

import com.skyfreight.portal.entity.ApprovalWorkflow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ApprovalWorkflowRepository extends JpaRepository<ApprovalWorkflow, Long> {

    Page<ApprovalWorkflow> findByStatus(ApprovalWorkflow.ApprovalStatus status, Pageable pageable);

    Optional<ApprovalWorkflow> findByUserId(Long userId);

    long countByStatus(ApprovalWorkflow.ApprovalStatus status);
}
