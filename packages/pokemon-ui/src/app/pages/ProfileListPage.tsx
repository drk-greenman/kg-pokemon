import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  AppBar,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import { ChevronRight } from '@mui/icons-material';
import { css } from '@emotion/react';
import { NewProfileDialog } from '../components/NewProfileDialog';
import { getProfiles, createProfile } from '../api/profiles';
import type { Profile } from '../types';

export function ProfileListPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    getProfiles()
      .then(setProfiles)
      .catch(err => setError(err.message ?? 'Unknown error'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (name: string) => {
    const newProfile = await createProfile(name);
    setProfiles(prev => [...prev, newProfile]);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Pokémon Team Builder</Typography>
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
        <List>
          {profiles.map(profile => (
            <ListItem key={profile.id} disablePadding>
              <ListItemButton onClick={() => navigate(`/profiles/${profile.id}`)}>
                <ListItemText primary={profile.name} />
                <ChevronRight />
              </ListItemButton>
            </ListItem>
          ))}
          <Divider />
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => setDialogOpen(true)}
              css={css`border: 2px dashed #bdbdbd; border-radius: 4px; margin: 8px;`}
            >
              <ListItemText primary="+ New Profile" />
            </ListItemButton>
          </ListItem>
        </List>
      )}

      <NewProfileDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={handleCreate}
      />
    </>
  );
}
