import { css } from '@emotion/react';
import { PokemonCard } from './PokemonCard';
import type { Pokemon } from '../types';

interface Props {
  pokemon: Pokemon[];
  selectedPokemonIds: number[];
  onSelect: (id: number) => void;
}

export function PokemonGrid({ pokemon, selectedPokemonIds, onSelect }: Props) {
  const atCap = selectedPokemonIds.length >= 6;

  const countMap = selectedPokemonIds.reduce<Record<number, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div
      css={css`
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
        gap: 8px;
        padding: 16px;
      `}
    >
      {pokemon.map(p => (
        <PokemonCard
          key={p.id}
          pokemon={p}
          count={countMap[p.id] ?? 0}
          atCap={atCap}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
