package com.pokemon.userbackend.controller;

import com.pokemon.userbackend.dto.CreateProfileRequest;
import com.pokemon.userbackend.dto.ProfileDto;
import com.pokemon.userbackend.dto.UpdateTeamRequest;
import com.pokemon.userbackend.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/profiles")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public List<ProfileDto> getProfiles() {
        return profileService.findAll();
    }

    @PostMapping
    public ResponseEntity<ProfileDto> createProfile(@Valid @RequestBody CreateProfileRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(profileService.create(request));
    }

    @GetMapping("/{id}")
    public ProfileDto getProfile(@PathVariable Integer id) {
        return profileService.getById(id);
    }

    @PutMapping("/{id}/team")
    public ProfileDto updateTeam(@PathVariable Integer id, @RequestBody UpdateTeamRequest request) {
        return profileService.updateTeam(id, request.pokemonIds());
    }
}
