import axios from 'axios';

describe('Profiles API', () => {
  describe('GET /api/profiles', () => {
    it('returns 200 with an empty array when no profiles exist', async () => {
      const res = await axios.get('/api/profiles');
      expect(res.status).toBe(200);
      expect(res.data).toEqual([]);
    });

    it('lists profiles after they are created', async () => {
      await axios.post('/api/profiles', { name: 'Ash' });
      await axios.post('/api/profiles', { name: 'Misty' });
      const res = await axios.get('/api/profiles');
      const names = res.data.map((p: { name: string }) => p.name);
      expect(names).toContain('Ash');
      expect(names).toContain('Misty');
    });

    it('each profile has id, name, and an empty pokemon array', async () => {
      await axios.post('/api/profiles', { name: 'Brock' });
      const res = await axios.get('/api/profiles');
      expect(res.data.length).toBeGreaterThan(0);
      for (const p of res.data) {
        expect(typeof p.id).toBe('number');
        expect(typeof p.name).toBe('string');
        expect(p.pokemon).toEqual([]);
      }
    });
  });

  describe('POST /api/profiles', () => {
    it('creates a profile and returns 201 with id, name, and empty pokemon array', async () => {
      const res = await axios.post('/api/profiles', { name: 'Gary' });
      expect(res.status).toBe(201);
      expect(typeof res.data.id).toBe('number');
      expect(res.data.name).toBe('Gary');
      expect(res.data.pokemon).toEqual([]);
    });

    it('returns 400 when name is missing from request body', async () => {
      await expect(axios.post('/api/profiles', {})).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    it('returns 400 when name is blank', async () => {
      await expect(axios.post('/api/profiles', { name: '   ' })).rejects.toMatchObject({
        response: { status: 400 },
      });
    });
  });

  describe('GET /api/profiles/:id', () => {
    it('returns the profile with an empty pokemon array when no team is set', async () => {
      const created = await axios.post('/api/profiles', { name: 'Leaf' });
      const res = await axios.get(`/api/profiles/${created.data.id}`);
      expect(res.status).toBe(200);
      expect(res.data.id).toBe(created.data.id);
      expect(res.data.name).toBe('Leaf');
      expect(res.data.pokemon).toEqual([]);
    });

    it('returns the profile with populated pokemon after team is set', async () => {
      const created = await axios.post('/api/profiles', { name: 'Blue' });
      const id = created.data.id;
      await axios.put(`/api/profiles/${id}/team`, { pokemonIds: [1, 4, 7] });
      const res = await axios.get(`/api/profiles/${id}`);
      expect(res.status).toBe(200);
      const returnedIds = res.data.pokemon.map((p: { id: number }) => p.id);
      expect(returnedIds).toContain(1);
      expect(returnedIds).toContain(4);
      expect(returnedIds).toContain(7);
    });

    it('returns 404 for a non-existent id', async () => {
      await expect(axios.get('/api/profiles/999999')).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });

  describe('PUT /api/profiles/:id/team', () => {
    it('sets the team and returns 200 with the profile and pokemon', async () => {
      const created = await axios.post('/api/profiles', { name: 'Red' });
      const id = created.data.id;
      const res = await axios.put(`/api/profiles/${id}/team`, { pokemonIds: [1, 4, 7] });
      expect(res.status).toBe(200);
      expect(res.data.id).toBe(id);
      expect(res.data.name).toBe('Red');
      const returnedIds = res.data.pokemon.map((p: { id: number }) => p.id);
      expect(returnedIds).toHaveLength(3);
      expect(returnedIds).toContain(1);
      expect(returnedIds).toContain(4);
      expect(returnedIds).toContain(7);
    });

    it('each pokemon in the returned team has id and name', async () => {
      const created = await axios.post('/api/profiles', { name: 'Kris' });
      const res = await axios.put(`/api/profiles/${created.data.id}/team`, { pokemonIds: [25] });
      expect(res.data.pokemon).toHaveLength(1);
      expect(res.data.pokemon[0].id).toBe(25);
      expect(res.data.pokemon[0].name).toBe('pikachu');
    });

    it('replaces the team on a second PUT', async () => {
      const created = await axios.post('/api/profiles', { name: 'Silver' });
      const id = created.data.id;
      await axios.put(`/api/profiles/${id}/team`, { pokemonIds: [1, 2, 3] });
      const res = await axios.put(`/api/profiles/${id}/team`, { pokemonIds: [4, 5] });
      expect(res.data.pokemon).toHaveLength(2);
      const returnedIds = res.data.pokemon.map((p: { id: number }) => p.id);
      expect(returnedIds).not.toContain(1);
      expect(returnedIds).toContain(4);
      expect(returnedIds).toContain(5);
    });

    it('allows setting an empty team', async () => {
      const created = await axios.post('/api/profiles', { name: 'Ethan' });
      const id = created.data.id;
      await axios.put(`/api/profiles/${id}/team`, { pokemonIds: [1, 2] });
      const res = await axios.put(`/api/profiles/${id}/team`, { pokemonIds: [] });
      expect(res.status).toBe(200);
      expect(res.data.pokemon).toEqual([]);
    });

    it('returns 400 when pokemonIds has more than 6 entries', async () => {
      const created = await axios.post('/api/profiles', { name: 'Lance' });
      await expect(
        axios.put(`/api/profiles/${created.data.id}/team`, {
          pokemonIds: [1, 2, 3, 4, 5, 6, 7],
        })
      ).rejects.toMatchObject({ response: { status: 400 } });
    });

    it('returns 400 when pokemonIds is null', async () => {
      const created = await axios.post('/api/profiles', { name: 'Clair' });
      await expect(
        axios.put(`/api/profiles/${created.data.id}/team`, { pokemonIds: null })
      ).rejects.toMatchObject({ response: { status: 400 } });
    });

    it('returns 404 for a non-existent profile id', async () => {
      await expect(
        axios.put('/api/profiles/999999/team', { pokemonIds: [1] })
      ).rejects.toMatchObject({ response: { status: 404 } });
    });

    it('returns 404 when any pokemon id does not exist', async () => {
      const created = await axios.post('/api/profiles', { name: 'Pryce' });
      await expect(
        axios.put(`/api/profiles/${created.data.id}/team`, { pokemonIds: [99999] })
      ).rejects.toMatchObject({ response: { status: 404 } });
    });
  });
});
