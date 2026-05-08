package com.pokemon.userbackend.dto;

import java.util.List;
import jakarta.validation.constraints.NotNull;

public record UpdateTeamRequest(@NotNull List<Integer> pokemonIds) {
}
