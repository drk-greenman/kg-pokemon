import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  AppBar,
  Button,
  CircularProgress,
  IconButton,
  Snackbar,
  Toolbar,
  Typography,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { css } from '@emotion/react';
import { TeamRow } from '../components/TeamRow';
import { PokemonGrid } from '../components/PokemonGrid';
import { getPokemons } from '../api/pokemon';
import { getProfile, updateTeam } from '../api/profiles';
import type { Pokemon } from '../types';

export function TeamBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const profileId = Number(id);
  const navigate = useNavigate();

  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [profileName, setProfileName] = useState('');
  const [selectedPokemonIds, setSelectedPokemonIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getPokemons(), getProfile(profileId)])
      .then(([pokemons, profile]) => {
        setPokemon(pokemons);
        setProfileName(profile.name);
        setSelectedPokemonIds(profile.pokemon.map(p => p.id));
      })
      .catch(err => setError(err.message ?? 'Unknown error'))
      .finally(() => setLoading(false));
  }, [profileId]);

  const handleSelect = (pokemonId: number) => {
    setSelectedPokemonIds(prev => [...prev, pokemonId]);
  };

  const handleRemove = (index: number) => {
    setSelectedPokemonIds(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      await updateTeam(profileId, selectedPokemonIds);
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setSaveError(`Failed to save team — ${msg}`);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton color="inherit" onClick={() => navigate('/')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" css={css`flex: 1; margin-left: 8px;`}>
            {profileName}
          </Typography>
          <Button color="inherit" onClick={handleSave}>
            Save
          </Button>
        </Toolbar>
      </AppBar>

      {loading && (
        <div css={css`display: flex; justify-content: center; margin-top: 64px;`}>
          <CircularProgress />
        </div>
      )}

      {error && (
        <Alert severity="error" css={css`margin: 16px;`}>
          Something went wrong — {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          <TeamRow selectedPokemonIds={selectedPokemonIds} onRemove={handleRemove} />
          <PokemonGrid
            pokemon={pokemon}
            selectedPokemonIds={selectedPokemonIds}
            onSelect={handleSelect}
          />
        </>
      )}

      <Snackbar
        open={saveError != null}
        autoHideDuration={5000}
        onClose={() => setSaveError(null)}
      >
        <Alert severity="error" onClose={() => setSaveError(null)}>
          {saveError}
        </Alert>
      </Snackbar>
    </>
  );
}
