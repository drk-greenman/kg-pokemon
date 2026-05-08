import { render, screen, fireEvent } from '@testing-library/react';
import { PokemonCard } from './PokemonCard';

const charmander = { id: 4, name: 'Charmander' };

describe('PokemonCard', () => {
  it('renders the sprite and name', () => {
    render(<PokemonCard pokemon={charmander} count={0} atCap={false} onSelect={vi.fn()} />);
    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img.src).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png'
    );
    expect(screen.getByText('Charmander')).toBeTruthy();
  });

  it('shows a count badge when the pokemon is on the team', () => {
    render(<PokemonCard pokemon={charmander} count={2} atCap={false} onSelect={vi.fn()} />);
    expect(screen.getByText('×2')).toBeTruthy();
  });

  it('shows no badge when count is 0', () => {
    render(<PokemonCard pokemon={charmander} count={0} atCap={false} onSelect={vi.fn()} />);
    expect(screen.queryByText(/×/)).toBeNull();
  });

  it('calls onSelect with the pokemon id on click', () => {
    const onSelect = vi.fn();
    render(<PokemonCard pokemon={charmander} count={0} atCap={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(4);
  });

  it('does not call onSelect when atCap is true', () => {
    const onSelect = vi.fn();
    render(<PokemonCard pokemon={charmander} count={0} atCap={true} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
