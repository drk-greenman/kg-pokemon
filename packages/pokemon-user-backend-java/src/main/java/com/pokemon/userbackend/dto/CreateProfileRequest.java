package com.pokemon.userbackend.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateProfileRequest(@NotBlank String name) {
}
