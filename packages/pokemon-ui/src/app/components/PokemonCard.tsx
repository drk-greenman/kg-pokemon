import { css } from '@emotion/react';
import type { Pokemon } from '../types';

const SPRITE_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

interface Props {
  pokemon: Pokemon;
  count: number;
  atCap: boolean;
  onSelect: (id: number) => void;
}

export function PokemonCard({ pokemon, count, atCap, onSelect }: Props) {
  return (
    <button
      onClick={() => { if (!atCap) onSelect(pokemon.id); }}
      css={css`
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: none;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 8px;
        cursor: ${atCap ? 'default' : 'pointer'};
        opacity: ${atCap ? 0.4 : 1};
        width: 100%;
        &:hover {
          background: ${atCap ? 'none' : '#f5f5f5'};
        }
      `}
    >
      <img
        src={`${SPRITE_BASE}/${pokemon.id}.png`}
        alt={pokemon.name}
        width={64}
        height={64}
      />
      <span css={css`font-size: 12px; text-align: center; text-transform: capitalize;`}>
        {pokemon.name}
      </span>
      {count > 0 && (
        <span
          css={css`
            position: absolute;
            top: 4px;
            right: 4px;
            background: #1976d2;
            color: white;
            border-radius: 12px;
            padding: 0 6px;
            font-size: 11px;
            font-weight: bold;
          `}
        >
          ×{count}
        </span>
      )}
    </button>
  );
}
