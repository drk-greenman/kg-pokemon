package com.pokemon.userbackend.repository;

import com.pokemon.userbackend.entity.Profile;
import com.pokemon.userbackend.entity.ProfilePokemon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ProfilePokemonRepository extends JpaRepository<ProfilePokemon, Integer> {

    List<ProfilePokemon> findByProfile(Profile profile);

    @Modifying
    @Transactional
    @Query("DELETE FROM ProfilePokemon pp WHERE pp.profile = :profile")
    void deleteByProfile(@Param("profile") Profile profile);
}
