package com.pokemon.userbackend.dto;

import java.util.List;

public record UpdateTeamRequest(List<Integer> pokemonIds) {
}
