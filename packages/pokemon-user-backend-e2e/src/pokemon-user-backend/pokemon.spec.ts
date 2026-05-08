import axios from 'axios';

interface Pokemon {
  id: number;
  name: string;
}

describe('GET /api/pokemon', () => {
  let pokemon: Pokemon[];

  beforeAll(async () => {
    const res = await axios.get('/api/pokemon');
    pokemon = res.data as Pokemon[];
  });

  it('returns 200 with exactly 150 pokemon', async () => {
    expect(Array.isArray(pokemon)).toBe(true);
    expect(pokemon).toHaveLength(150);
  });

  it('each pokemon has a numeric id and non-empty string name', async () => {
    for (const p of pokemon) {
      expect(typeof p.id).toBe('number');
      expect(typeof p.name).toBe('string');
      expect(p.name.length).toBeGreaterThan(0);
    }
  });

  it('contains bulbasaur at id 1 and mewtwo at id 150', async () => {
    const byId: Record<number, string> = Object.fromEntries(
      pokemon.map((p: Pokemon) => [p.id, p.name])
    );
    expect(byId[1]).toBe('bulbasaur');
    expect(byId[150]).toBe('mewtwo');
  });

  it('contains pikachu at id 25', async () => {
    const pikachu = pokemon.find((p: Pokemon) => p.id === 25);
    expect(pikachu?.name).toBe('pikachu');
  });
});
