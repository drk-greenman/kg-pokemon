package com.pokemon.userbackend.service;

import com.pokemon.userbackend.dto.CreateProfileRequest;
import com.pokemon.userbackend.entity.Profile;
import com.pokemon.userbackend.mapper.PokemonMapper;
import com.pokemon.userbackend.mapper.ProfileMapper;
import com.pokemon.userbackend.repository.PokemonRepository;
import com.pokemon.userbackend.repository.ProfilePokemonRepository;
import com.pokemon.userbackend.repository.ProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock
    private ProfileRepository profileRepository;
    @Mock
    private PokemonRepository pokemonRepository;
    @Mock
    private ProfilePokemonRepository profilePokemonRepository;

    private ProfileService profileService;

    @BeforeEach
    void setUp() {
        var profileMapper = new ProfileMapper(new PokemonMapper());
        profileService = new ProfileService(
                profileRepository, pokemonRepository, profilePokemonRepository, profileMapper);
    }

    @Test
    void findAll_returnsDtoList() {
        var ash = new Profile();
        ash.setId(1);
        ash.setName("ash");
        when(profileRepository.findAll()).thenReturn(List.of(ash));

        var result = profileService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(1);
        assertThat(result.get(0).name()).isEqualTo("ash");
        assertThat(result.get(0).pokemon()).isEmpty();
    }

    @Test
    void create_savesAndReturnsDtoWithEmptyTeam() {
        var saved = new Profile();
        saved.setId(1);
        saved.setName("ash");
        when(profileRepository.save(any(Profile.class))).thenReturn(saved);

        var result = profileService.create(new CreateProfileRequest("ash"));

        assertThat(result.id()).isEqualTo(1);
        assertThat(result.name()).isEqualTo("ash");
        assertThat(result.pokemon()).isEmpty();
    }
}
