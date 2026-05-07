package com.pokemon.userbackend.mapper;

import com.pokemon.userbackend.entity.Pokemon;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PokemonMapperTest {

    private final PokemonMapper mapper = new PokemonMapper();

    @Test
    void toDto_mapsIdAndName() {
        var entity = new Pokemon();
        entity.setId(25);
        entity.setName("pikachu");

        var dto = mapper.toDto(entity);

        assertThat(dto.id()).isEqualTo(25);
        assertThat(dto.name()).isEqualTo("pikachu");
    }
}
