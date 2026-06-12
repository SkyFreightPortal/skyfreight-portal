package com.skyfreight.portal.service;

import com.skyfreight.portal.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${skyfreight.app.name}")
    private String appName;

    @Value("${skyfreight.app.base-url}")
    private String baseUrl;

    @Value("${skyfreight.app.support-email}")
    private String supportEmail;

    @Async
    public void sendRegistrationPendingEmail(User user) {
        String subject = appName + " — Registration Received";
        String body = buildRegistrationPendingHtml(user);
        sendHtmlEmail(user.getEmail(), subject, body);
    }

    @Async
    public void sendApprovalEmail(User user) {
        String subject = appName + " — Account Approved";
        String body = buildApprovalHtml(user);
        sendHtmlEmail(user.getEmail(), subject, body);
    }

    @Async
    public void sendRejectionEmail(User user, String notes) {
        String subject = appName + " — Account Registration Update";
        String body = buildRejectionHtml(user, notes);
        sendHtmlEmail(user.getEmail(), subject, body);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(supportEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to {}: {}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    private String buildRegistrationPendingHtml(User user) {
        return """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                  <div style="background:#1a3c6e;padding:24px;text-align:center">
                    <h1 style="color:#fff;margin:0">✈ SkyFreight Portal</h1>
                  </div>
                  <div style="padding:32px;background:#f9fafb">
                    <h2 style="color:#1a3c6e">Registration Received</h2>
                    <p>Dear %s,</p>
                    <p>Thank you for registering with <strong>SkyFreight Portal</strong>.
                    Your account is currently under review by our team.</p>
                    <p>You will receive another email once your account has been approved.
                    This typically takes 1–2 business days.</p>
                    <p style="color:#64748b;font-size:13px">
                    If you have any questions, contact us at <a href="mailto:%s">%s</a></p>
                  </div>
                </div>
                """.formatted(user.getFirstName(), supportEmail, supportEmail);
    }

    private String buildApprovalHtml(User user) {
        return """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                  <div style="background:#1a3c6e;padding:24px;text-align:center">
                    <h1 style="color:#fff;margin:0">✈ SkyFreight Portal</h1>
                  </div>
                  <div style="padding:32px;background:#f9fafb">
                    <h2 style="color:#16a34a">Account Approved!</h2>
                    <p>Dear %s,</p>
                    <p>Great news! Your SkyFreight Portal account has been approved.</p>
                    <p>You can now log in and start managing your cargo bookings.</p>
                    <div style="text-align:center;margin:32px 0">
                      <a href="%s/login" style="background:#1a3c6e;color:#fff;padding:14px 32px;
                         text-decoration:none;border-radius:8px;font-weight:bold">
                         Log In to Portal
                      </a>
                    </div>
                  </div>
                </div>
                """.formatted(user.getFirstName(), baseUrl);
    }

    private String buildRejectionHtml(User user, String notes) {
        return """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                  <div style="background:#1a3c6e;padding:24px;text-align:center">
                    <h1 style="color:#fff;margin:0">✈ SkyFreight Portal</h1>
                  </div>
                  <div style="padding:32px;background:#f9fafb">
                    <h2 style="color:#dc2626">Registration Update</h2>
                    <p>Dear %s,</p>
                    <p>After reviewing your registration, we are unable to approve your account at this time.</p>
                    %s
                    <p>Please contact <a href="mailto:%s">%s</a> for further assistance.</p>
                  </div>
                </div>
                """.formatted(user.getFirstName(),
                notes != null ? "<p><strong>Reason:</strong> " + notes + "</p>" : "",
                supportEmail, supportEmail);
    }
}
