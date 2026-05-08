import { render, screen, fireEvent } from '@testing-library/react';
import { PokemonGrid } from './PokemonGrid';

const pokemon = Array.from({ length: 3 }, (_, i) => ({ id: i + 1, name: `Pokemon ${i + 1}` }));

describe('PokemonGrid', () => {
  it('renders one card per pokemon', () => {
    render(<PokemonGrid pokemon={pokemon} selectedPokemonIds={[]} onSelect={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('does not call onSelect when at cap (6 selected)', () => {
    const sixIds = [1, 2, 3, 4, 5, 6];
    const onSelect = vi.fn();
    render(<PokemonGrid pokemon={pokemon} selectedPokemonIds={sixIds} onSelect={onSelect} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
