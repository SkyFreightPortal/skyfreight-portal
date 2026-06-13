package com.skyfreight.portal.exception;

import com.skyfreight.portal.entity.Offer;

public class NoRateAvailableException extends RuntimeException {
    public NoRateAvailableException(String origin, String destination, Offer.ServiceType serviceType) {
        super("No rate card available for route " + origin + " -> " + destination
                + " and service type " + serviceType + ". Please contact Revenue Management.");
    }
}
