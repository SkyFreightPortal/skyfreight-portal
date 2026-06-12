package com.skyfreight.portal.exception;

public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException(String email) {
        super("An account with email '" + email + "' already exists");
    }
}
