package com.pokemon.userbackend.mapper;

import com.pokemon.userbackend.dto.PokemonDto;
import com.pokemon.userbackend.entity.Pokemon;
import org.springframework.stereotype.Component;

@Component
public class PokemonMapper {

    public PokemonDto toDto(Pokemon pokemon) {
        return new PokemonDto(pokemon.getId(), pokemon.getName());
    }
}
