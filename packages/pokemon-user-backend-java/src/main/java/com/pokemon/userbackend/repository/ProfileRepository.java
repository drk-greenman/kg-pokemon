package com.pokemon.userbackend.repository;

import com.pokemon.userbackend.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileRepository extends JpaRepository<Profile, Integer> {
}
