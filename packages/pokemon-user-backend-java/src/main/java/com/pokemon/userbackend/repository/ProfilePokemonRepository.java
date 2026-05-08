package com.pokemon.userbackend.repository;

import com.pokemon.userbackend.entity.Profile;
import com.pokemon.userbackend.entity.ProfilePokemon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ProfilePokemonRepository extends JpaRepository<ProfilePokemon, Integer> {

    List<ProfilePokemon> findByProfile(Profile profile);

    @Transactional
    void deleteByProfile(Profile profile);
}
