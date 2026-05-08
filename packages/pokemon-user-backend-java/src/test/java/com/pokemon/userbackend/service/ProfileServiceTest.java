package com.pokemon.userbackend.service;

import com.pokemon.userbackend.dto.CreateProfileRequest;
import com.pokemon.userbackend.entity.Profile;
import com.pokemon.userbackend.mapper.PokemonMapper;
import com.pokemon.userbackend.mapper.ProfileMapper;
import com.pokemon.userbackend.repository.PokemonRepository;
import com.pokemon.userbackend.repository.ProfilePokemonRepository;
import com.pokemon.userbackend.repository.ProfileRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock
    private ProfileRepository profileRepository;
    @Mock
    private PokemonRepository pokemonRepository;
    @Mock
    private ProfilePokemonRepository profilePokemonRepository;
    @Mock
    private EntityManager entityManager;

    private ProfileService profileService;

    @BeforeEach
    void setUp() {
        var profileMapper = new ProfileMapper(new PokemonMapper());
        profileService = new ProfileService(
                profileRepository, pokemonRepository, profilePokemonRepository, profileMapper, entityManager);
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

    @Test
    void getById_returnsProfileWithTeam() {
        var ash = new Profile();
        ash.setId(1);
        ash.setName("ash");
        when(profileRepository.findById(1)).thenReturn(java.util.Optional.of(ash));
        when(profilePokemonRepository.findByProfile(ash)).thenReturn(List.of());

        var result = profileService.getById(1);

        assertThat(result.id()).isEqualTo(1);
        assertThat(result.name()).isEqualTo("ash");
        assertThat(result.pokemon()).isEmpty();
    }

    @Test
    void getById_throwsWhenNotFound() {
        when(profileRepository.findById(99)).thenReturn(java.util.Optional.empty());

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> profileService.getById(99))
                .isInstanceOf(com.pokemon.userbackend.exception.ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void updateTeam_throwsWhenMoreThanSixPokemon() {
        var ids = List.of(1, 2, 3, 4, 5, 6, 7);

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> profileService.updateTeam(1, ids))
                .isInstanceOf(com.pokemon.userbackend.exception.TeamSizeExceededException.class);
    }

    @Test
    void updateTeam_throwsWhenProfileNotFound() {
        when(profileRepository.findById(99)).thenReturn(java.util.Optional.empty());

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> profileService.updateTeam(99, List.of(1)))
                .isInstanceOf(com.pokemon.userbackend.exception.ResourceNotFoundException.class);
    }

    @Test
    void updateTeam_throwsWhenPokemonIdNotFound() {
        var ash = new Profile();
        ash.setId(1);
        ash.setName("ash");
        when(profileRepository.findById(1)).thenReturn(java.util.Optional.of(ash));
        when(pokemonRepository.findAllById(List.of(999))).thenReturn(List.of());

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> profileService.updateTeam(1, List.of(999)))
                .isInstanceOf(com.pokemon.userbackend.exception.ResourceNotFoundException.class)
                .hasMessageContaining("999");
    }

    @Test
    void updateTeam_replacesTeamAndReturnsDto() {
        var ash = new Profile();
        ash.setId(1);
        ash.setName("ash");
        var bulbasaur = new com.pokemon.userbackend.entity.Pokemon();
        bulbasaur.setId(1);
        bulbasaur.setName("bulbasaur");

        when(profileRepository.findById(1)).thenReturn(java.util.Optional.of(ash));
        when(pokemonRepository.findAllById(List.of(1))).thenReturn(List.of(bulbasaur));
        when(profilePokemonRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        var result = profileService.updateTeam(1, List.of(1));

        assertThat(result.id()).isEqualTo(1);
        assertThat(result.pokemon()).hasSize(1);
        assertThat(result.pokemon().get(0).id()).isEqualTo(1);
        assertThat(result.pokemon().get(0).name()).isEqualTo("bulbasaur");

        verify(profilePokemonRepository).deleteByProfile(ash);
    }

    @Test
    void updateTeam_forceIncrementsProfileVersionForOptimisticLocking() {
        var ash = new Profile();
        ash.setId(1);
        ash.setName("ash");
        var bulbasaur = new com.pokemon.userbackend.entity.Pokemon();
        bulbasaur.setId(1);
        bulbasaur.setName("bulbasaur");

        when(profileRepository.findById(1)).thenReturn(java.util.Optional.of(ash));
        when(pokemonRepository.findAllById(List.of(1))).thenReturn(List.of(bulbasaur));
        when(profilePokemonRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        profileService.updateTeam(1, List.of(1));

        verify(entityManager).lock(ash, LockModeType.OPTIMISTIC_FORCE_INCREMENT);
    }
}
