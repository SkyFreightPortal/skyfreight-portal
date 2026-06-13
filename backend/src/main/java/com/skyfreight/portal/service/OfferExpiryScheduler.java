package com.skyfreight.portal.service;

import com.skyfreight.portal.entity.Offer;
import com.skyfreight.portal.repository.OfferRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Periodically marks ACTIVE offers whose validity period has passed as EXPIRED.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OfferExpiryScheduler {

    private final OfferRepository offerRepository;

    @Scheduled(fixedRate = 900_000) // every 15 minutes
    @Transactional
    public void expireOffers() {
        int updated = offerRepository.expireOffers(
                Offer.OfferStatus.ACTIVE, Offer.OfferStatus.EXPIRED, LocalDateTime.now());
        if (updated > 0) {
            log.info("Auto-expired {} offer(s) past their validity period", updated);
        }
    }
}
