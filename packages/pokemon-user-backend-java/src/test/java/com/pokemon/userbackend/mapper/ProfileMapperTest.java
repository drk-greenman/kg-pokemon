package com.pokemon.userbackend.mapper;

import com.pokemon.userbackend.entity.Pokemon;
import com.pokemon.userbackend.entity.Profile;
import com.pokemon.userbackend.entity.ProfilePokemon;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ProfileMapperTest {

    private ProfileMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new ProfileMapper(new PokemonMapper());
    }

    @Test
    void toDto_withNoTeam_returnsEmptyPokemonList() {
        var profile = new Profile();
        profile.setId(1);
        profile.setName("ash");

        var dto = mapper.toDto(profile);

        assertThat(dto.id()).isEqualTo(1);
        assertThat(dto.name()).isEqualTo("ash");
        assertThat(dto.pokemon()).isEmpty();
    }

    @Test
    void toDto_withTeam_mapsPokemon() {
        var profile = new Profile();
        profile.setId(1);
        profile.setName("ash");

        var bulbasaur = new Pokemon();
        bulbasaur.setId(1);
        bulbasaur.setName("bulbasaur");

        var pp = new ProfilePokemon();
        pp.setProfile(profile);
        pp.setPokemon(bulbasaur);

        var dto = mapper.toDto(profile, List.of(pp));

        assertThat(dto.pokemon()).hasSize(1);
        assertThat(dto.pokemon().get(0).id()).isEqualTo(1);
        assertThat(dto.pokemon().get(0).name()).isEqualTo("bulbasaur");
    }
}
