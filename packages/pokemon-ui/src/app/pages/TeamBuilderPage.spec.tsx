import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TeamBuilderPage } from './TeamBuilderPage';
import * as pokemonApi from '../api/pokemon';
import * as profilesApi from '../api/profiles';

vi.mock('../api/pokemon');
vi.mock('../api/profiles');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async importOriginal => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return { ...mod, useNavigate: () => mockNavigate };
});

const mockPokemon = [
  { id: 1, name: 'Bulbasaur' },
  { id: 4, name: 'Charmander' },
  { id: 7, name: 'Squirtle' },
];

const mockProfile = {
  id: 1,
  name: 'Ash',
  pokemon: [{ id: 4, name: 'Charmander' }],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/profiles/1']}>
      <Routes>
        <Route path="/profiles/:id" element={<TeamBuilderPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('TeamBuilderPage', () => {
  beforeEach(() => {
    vi.mocked(pokemonApi.getPokemons).mockResolvedValue(mockPokemon);
    vi.mocked(profilesApi.getProfile).mockResolvedValue(mockProfile);
    vi.mocked(profilesApi.updateTeam).mockResolvedValue({ ...mockProfile, pokemon: [] });
    mockNavigate.mockReset();
  });

  it('shows the profile name in the AppBar', async () => {
    renderPage();
    expect(await screen.findByText('Ash')).toBeTruthy();
  });

  it('seeds selectedPokemonIds from the profile — Charmander slot is filled', async () => {
    renderPage();
    await screen.findByText('Charmander');
    const teamImgs = screen.getAllByRole('img').filter(
      img => img.getAttribute('src')?.includes('/4.png')
    );
    expect(teamImgs.length).toBeGreaterThanOrEqual(1);
  });

  it('calls updateTeam with correct ids and profile id on Save', async () => {
    renderPage();
    await screen.findByText('Ash');
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() =>
      expect(profilesApi.updateTeam).toHaveBeenCalledWith(1, [4])
    );
  });

  it('navigates to / after a successful save', async () => {
    renderPage();
    await screen.findByText('Ash');
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('shows a Snackbar error when save fails — stays on page', async () => {
    vi.mocked(profilesApi.updateTeam).mockRejectedValue(new Error('Server error'));
    renderPage();
    await screen.findByText('Ash');
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(await screen.findByText(/failed to save/i)).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows a loading indicator before data is ready', () => {
    vi.mocked(pokemonApi.getPokemons).mockReturnValue(new Promise(() => {}));
    vi.mocked(profilesApi.getProfile).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  it('shows an error alert when a fetch fails', async () => {
    vi.mocked(pokemonApi.getPokemons).mockRejectedValue(new Error('Network'));
    renderPage();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText(/something went wrong/i)).toBeTruthy();
  });
});
