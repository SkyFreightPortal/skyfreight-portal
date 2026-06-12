package com.skyfreight.portal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_user", columnList = "user_id"),
        @Index(name = "idx_audit_action", columnList = "action")
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(name = "user_id")
    private Long userId;

    @Column(length = 150)
    private String userEmail;

    @Column(length = 45)
    private String ipAddress;

    @Column(length = 500)
    private String details;

    @Column(nullable = false, length = 10)
    private String outcome;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
