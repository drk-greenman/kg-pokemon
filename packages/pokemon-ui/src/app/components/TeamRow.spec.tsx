import { render, screen, fireEvent } from '@testing-library/react';
import { TeamRow } from './TeamRow';

describe('TeamRow', () => {
  it('always renders 6 slots', () => {
    render(<TeamRow selectedPokemonIds={[]} onRemove={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(6);
  });

  it('renders sprite images for filled slots', () => {
    render(<TeamRow selectedPokemonIds={[4, 7]} onRemove={vi.fn()} />);
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(2);
    expect((imgs[0] as HTMLImageElement).src).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png'
    );
    expect((imgs[1] as HTMLImageElement).src).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png'
    );
  });

  it('calls onRemove with the slot index when a filled slot is clicked', () => {
    const onRemove = vi.fn();
    render(<TeamRow selectedPokemonIds={[4, 7]} onRemove={onRemove} />);
    fireEvent.click(screen.getAllByRole('button')[1]);
    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it('does not call onRemove when an empty slot is clicked', () => {
    const onRemove = vi.fn();
    render(<TeamRow selectedPokemonIds={[4]} onRemove={onRemove} />);
    fireEvent.click(screen.getAllByRole('button')[5]);
    expect(onRemove).not.toHaveBeenCalled();
  });
});
