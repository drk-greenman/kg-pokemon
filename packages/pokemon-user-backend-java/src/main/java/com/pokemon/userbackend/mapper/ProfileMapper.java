package com.pokemon.userbackend.mapper;

import com.pokemon.userbackend.dto.PokemonDto;
import com.pokemon.userbackend.dto.ProfileDto;
import com.pokemon.userbackend.entity.Profile;
import com.pokemon.userbackend.entity.ProfilePokemon;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ProfileMapper {

    private final PokemonMapper pokemonMapper;

    public ProfileMapper(PokemonMapper pokemonMapper) {
        this.pokemonMapper = pokemonMapper;
    }

    public ProfileDto toDto(Profile profile) {
        return toDto(profile, List.of());
    }

    public ProfileDto toDto(Profile profile, List<ProfilePokemon> team) {
        List<PokemonDto> pokemon = team.stream()
                .map(pp -> pokemonMapper.toDto(pp.getPokemon()))
                .toList();
        return new ProfileDto(profile.getId(), profile.getName(), pokemon);
    }
}
