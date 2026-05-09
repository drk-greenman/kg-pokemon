import { css } from '@emotion/react';
import { Avatar } from '@mui/material';
import { SPRITE_BASE } from '../constants';

const SLOTS = [0, 1, 2, 3, 4, 5];

interface Props {
  selectedPokemonIds: number[];
  onRemove: (index: number) => void;
}

export function TeamRow({ selectedPokemonIds, onRemove }: Props) {
  return (
    <div
      css={css`
        display: flex;
        gap: 8px;
        padding: 8px 16px;
        background: white;
        border-bottom: 1px solid #e0e0e0;
        position: sticky;
        top: 64px;
        z-index: 10;
      `}
    >
      {SLOTS.map(i => {
        const id = selectedPokemonIds[i];
        const filled = id != null;
        return (
          <button
            type='button'
            key={i}
            onClick={() => {
              if (filled) onRemove(i);
            }}
            css={css`
              background: none;
              border: ${filled ? 'none' : '2px dashed #bdbdbd'};
              border-radius: 50%;
              padding: 0;
              cursor: ${filled ? 'pointer' : 'default'};
              width: 56px;
              height: 56px;
              display: flex;
              align-items: center;
              justify-content: center;
            `}
          >
            {filled ? (
              <Avatar
                src={`${SPRITE_BASE}/${id}.png`}
                alt={`Slot ${i + 1}`}
                variant="square"
                sx={{ width: 48, height: 48 }}
              />
            ) : (
              <span
                css={css`
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  display: block;
                `}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
