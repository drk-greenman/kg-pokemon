package com.pokemon.userbackend.dto;

import java.util.List;

public record ProfileDto(Integer id, String name, List<PokemonDto> pokemon) {
}
