package com.pokemon.userbackend.controller;

import com.pokemon.userbackend.dto.PokemonDto;
import com.pokemon.userbackend.service.PokemonService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/pokemon")
public class PokemonController {

    private final PokemonService pokemonService;

    public PokemonController(PokemonService pokemonService) {
        this.pokemonService = pokemonService;
    }

    @GetMapping
    public List<PokemonDto> getPokemon() {
        return pokemonService.findAll();
    }
}
