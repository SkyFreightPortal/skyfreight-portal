package com.skyfreight.portal.exception;

public class OfferNotFoundException extends RuntimeException {
    public OfferNotFoundException(Long id) { super("Offer not found with id: " + id); }
}
