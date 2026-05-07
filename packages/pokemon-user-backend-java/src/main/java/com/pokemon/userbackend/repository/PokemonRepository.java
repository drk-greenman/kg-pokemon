package com.pokemon.userbackend.repository;

import com.pokemon.userbackend.entity.Pokemon;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PokemonRepository extends JpaRepository<Pokemon, Integer> {
}
