package com.pokemon.userbackend.controller;

import com.pokemon.userbackend.dto.CreateProfileRequest;
import com.pokemon.userbackend.dto.PokemonDto;
import com.pokemon.userbackend.dto.ProfileDto;
import com.pokemon.userbackend.exception.ResourceNotFoundException;
import com.pokemon.userbackend.service.ProfileService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProfileController.class)
class ProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProfileService profileService;

    @Test
    void getProfiles_returns200WithList() throws Exception {
        when(profileService.findAll()).thenReturn(List.of(
                new ProfileDto(1, "ash", List.of())
        ));

        mockMvc.perform(get("/profiles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("ash"));
    }

    @Test
    void createProfile_returns201WithDto() throws Exception {
        when(profileService.create(new CreateProfileRequest("ash")))
                .thenReturn(new ProfileDto(1, "ash", List.of()));

        mockMvc.perform(post("/profiles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"ash\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("ash"));
    }

    @Test
    void createProfile_returns400WhenNameIsBlank() throws Exception {
        mockMvc.perform(post("/profiles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void getProfile_returns200WithTeam() throws Exception {
        when(profileService.getById(1)).thenReturn(
                new ProfileDto(1, "ash", List.of(new PokemonDto(1, "bulbasaur")))
        );

        mockMvc.perform(get("/profiles/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("ash"))
                .andExpect(jsonPath("$.pokemon.length()").value(1))
                .andExpect(jsonPath("$.pokemon[0].name").value("bulbasaur"));
    }

    @Test
    void getProfile_returns404WhenNotFound() throws Exception {
        when(profileService.getById(99))
                .thenThrow(new ResourceNotFoundException("Profile not found: 99"));

        mockMvc.perform(get("/profiles/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Profile not found: 99"));
    }

    @Test
    void updateTeam_returns200WithUpdatedTeam() throws Exception {
        when(profileService.updateTeam(eq(1), any())).thenReturn(
                new ProfileDto(1, "ash", List.of(
                        new PokemonDto(1, "bulbasaur"),
                        new PokemonDto(4, "charmander")
                ))
        );

        mockMvc.perform(put("/profiles/1/team")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"pokemonIds\": [1, 4]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pokemon.length()").value(2))
                .andExpect(jsonPath("$.pokemon[0].id").value(1))
                .andExpect(jsonPath("$.pokemon[1].id").value(4));
    }

    @Test
    void updateTeam_returns400WhenMoreThanSixPokemon() throws Exception {
        mockMvc.perform(put("/profiles/1/team")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"pokemonIds\": [1,2,3,4,5,6,7]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void updateTeam_returns404WhenPokemonNotFound() throws Exception {
        when(profileService.updateTeam(eq(1), any()))
                .thenThrow(new ResourceNotFoundException("Pokémon IDs not found: [999]"));

        mockMvc.perform(put("/profiles/1/team")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"pokemonIds\": [999]}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void updateTeam_returns409OnConcurrentUpdate() throws Exception {
        when(profileService.updateTeam(eq(1), any()))
                .thenThrow(new OptimisticLockingFailureException("version conflict"));

        mockMvc.perform(put("/profiles/1/team")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"pokemonIds\": [1]}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }
}
