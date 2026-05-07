package com.pokemon.userbackend.service;

import com.pokemon.userbackend.dto.PokemonDto;
import com.pokemon.userbackend.mapper.PokemonMapper;
import com.pokemon.userbackend.repository.PokemonRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PokemonService {

    private final PokemonRepository pokemonRepository;
    private final PokemonMapper pokemonMapper;

    public PokemonService(PokemonRepository pokemonRepository, PokemonMapper pokemonMapper) {
        this.pokemonRepository = pokemonRepository;
        this.pokemonMapper = pokemonMapper;
    }

    public List<PokemonDto> findAll() {
        return pokemonRepository.findAll().stream()
                .map(pokemonMapper::toDto)
                .toList();
    }
}
