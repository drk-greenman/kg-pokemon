package com.pokemon.userbackend.exception;

public class TeamSizeExceededException extends RuntimeException {
    public TeamSizeExceededException(String message) {
        super(message);
    }
}
