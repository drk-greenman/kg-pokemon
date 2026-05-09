package com.pokemon.userbackend.service;

import com.pokemon.userbackend.dto.CreateProfileRequest;
import com.pokemon.userbackend.dto.ProfileDto;
import com.pokemon.userbackend.entity.Pokemon;
import com.pokemon.userbackend.entity.Profile;
import com.pokemon.userbackend.entity.ProfilePokemon;
import com.pokemon.userbackend.exception.ResourceNotFoundException;
import com.pokemon.userbackend.exception.TeamSizeExceededException;
import com.pokemon.userbackend.mapper.ProfileMapper;
import com.pokemon.userbackend.repository.PokemonRepository;
import com.pokemon.userbackend.repository.ProfilePokemonRepository;
import com.pokemon.userbackend.repository.ProfileRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final PokemonRepository pokemonRepository;
    private final ProfilePokemonRepository profilePokemonRepository;
    private final ProfileMapper profileMapper;
    private final EntityManager entityManager;

    public ProfileService(ProfileRepository profileRepository,
                          PokemonRepository pokemonRepository,
                          ProfilePokemonRepository profilePokemonRepository,
                          ProfileMapper profileMapper,
                          EntityManager entityManager) {
        this.profileRepository = profileRepository;
        this.pokemonRepository = pokemonRepository;
        this.profilePokemonRepository = profilePokemonRepository;
        this.profileMapper = profileMapper;
        this.entityManager = entityManager;
    }

    public List<ProfileDto> findAll() {
        return profileRepository.findAll().stream()
                .map(profileMapper::toDto)
                .toList();
    }

    public ProfileDto create(CreateProfileRequest request) {
        Profile profile = new Profile();
        profile.setName(request.name());
        Profile saved = profileRepository.save(profile);
        return profileMapper.toDto(saved);
    }

    public ProfileDto getById(Integer id) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found: " + id));
        List<ProfilePokemon> team = profilePokemonRepository.findByProfile(profile);
        return profileMapper.toDto(profile, team);
    }

    @Transactional
    public ProfileDto updateTeam(Integer profileId, List<Integer> pokemonIds) {
        if (pokemonIds.size() > 6) {
            throw new TeamSizeExceededException("Team cannot have more than 6 Pokémon");
        }

        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found: " + profileId));

        Map<Integer, Pokemon> pokemonById = resolvePokemon(pokemonIds);

        profilePokemonRepository.deleteByProfile(profile);

        List<ProfilePokemon> team = pokemonIds.stream()
                .map(id -> {
                    ProfilePokemon pp = new ProfilePokemon();
                    pp.setProfile(profile);
                    pp.setPokemon(pokemonById.get(id));
                    return pp;
                })
                .toList();
        List<ProfilePokemon> savedTeam = profilePokemonRepository.saveAll(team);

        // Profile's own fields didn't change, but the team did — force-increment the version so
        // concurrent updateTeam calls on the same profile detect the conflict via optimistic locking.
        entityManager.lock(profile, LockModeType.OPTIMISTIC_FORCE_INCREMENT);

        return profileMapper.toDto(profile, savedTeam);
    }

    private Map<Integer, Pokemon> resolvePokemon(List<Integer> pokemonIds) {
        List<Integer> uniqueIds = pokemonIds.stream().distinct().toList();
        List<Pokemon> found = pokemonRepository.findAllById(uniqueIds);
        if (found.size() != uniqueIds.size()) {
            List<Integer> foundIds = found.stream().map(Pokemon::getId).toList();
            List<Integer> missing = uniqueIds.stream().filter(id -> !foundIds.contains(id)).toList();
            throw new ResourceNotFoundException("Pokémon IDs not found: " + missing);
        }
        return found.stream().collect(Collectors.toMap(Pokemon::getId, p -> p));
    }
}
