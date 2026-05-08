import axios from 'axios';

describe('GET /api/pokemon', () => {
  it('returns 200 with exactly 150 pokemon', async () => {
    const res = await axios.get('/api/pokemon');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data).toHaveLength(150);
  });

  it('each pokemon has a numeric id and non-empty string name', async () => {
    const res = await axios.get('/api/pokemon');
    for (const p of res.data) {
      expect(typeof p.id).toBe('number');
      expect(typeof p.name).toBe('string');
      expect(p.name.length).toBeGreaterThan(0);
    }
  });

  it('contains bulbasaur at id 1 and mewtwo at id 150', async () => {
    const res = await axios.get('/api/pokemon');
    const byId: Record<number, string> = Object.fromEntries(
      res.data.map((p: { id: number; name: string }) => [p.id, p.name])
    );
    expect(byId[1]).toBe('bulbasaur');
    expect(byId[150]).toBe('mewtwo');
  });

  it('contains pikachu at id 25', async () => {
    const res = await axios.get('/api/pokemon');
    const pikachu = res.data.find((p: { id: number }) => p.id === 25);
    expect(pikachu).toBeDefined();
    expect(pikachu.name).toBe('pikachu');
  });
});
