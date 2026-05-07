package com.pokemon.userbackend.service;

import com.pokemon.userbackend.entity.Pokemon;
import com.pokemon.userbackend.mapper.PokemonMapper;
import com.pokemon.userbackend.repository.PokemonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PokemonServiceTest {

    @Mock
    private PokemonRepository pokemonRepository;

    private PokemonService pokemonService;

    @BeforeEach
    void setUp() {
        pokemonService = new PokemonService(pokemonRepository, new PokemonMapper());
    }

    @Test
    void findAll_returnsMappedDtos() {
        var bulbasaur = new Pokemon();
        bulbasaur.setId(1);
        bulbasaur.setName("bulbasaur");
        when(pokemonRepository.findAll()).thenReturn(List.of(bulbasaur));

        var result = pokemonService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(1);
        assertThat(result.get(0).name()).isEqualTo("bulbasaur");
    }

    @Test
    void findAll_returnsEmptyListWhenNoPokemon() {
        when(pokemonRepository.findAll()).thenReturn(List.of());

        var result = pokemonService.findAll();

        assertThat(result).isEmpty();
    }
}
