package com.pokemon.userbackend.service;

import com.pokemon.userbackend.dto.CreateProfileRequest;
import com.pokemon.userbackend.dto.ProfileDto;
import com.pokemon.userbackend.entity.Profile;
import com.pokemon.userbackend.mapper.ProfileMapper;
import com.pokemon.userbackend.repository.PokemonRepository;
import com.pokemon.userbackend.repository.ProfilePokemonRepository;
import com.pokemon.userbackend.repository.ProfileRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final PokemonRepository pokemonRepository;
    private final ProfilePokemonRepository profilePokemonRepository;
    private final ProfileMapper profileMapper;

    public ProfileService(ProfileRepository profileRepository,
                          PokemonRepository pokemonRepository,
                          ProfilePokemonRepository profilePokemonRepository,
                          ProfileMapper profileMapper) {
        this.profileRepository = profileRepository;
        this.pokemonRepository = pokemonRepository;
        this.profilePokemonRepository = profilePokemonRepository;
        this.profileMapper = profileMapper;
    }

    public List<ProfileDto> findAll() {
        return profileRepository.findAll().stream()
                .map(profileMapper::toDto)
                .toList();
    }

    public ProfileDto create(CreateProfileRequest request) {
        var profile = new Profile();
        profile.setName(request.name());
        var saved = profileRepository.save(profile);
        return profileMapper.toDto(saved);
    }
}
