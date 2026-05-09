package com.pokemon.userbackend.dto;

import java.util.List;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateTeamRequest(@NotNull @Size(max = 6, message = "Team cannot have more than 6 Pokémon") List<Integer> pokemonIds) {
}
