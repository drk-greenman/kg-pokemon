import client from './client';
import type { Pokemon } from '../types';

export async function getPokemons(): Promise<Pokemon[]> {
  const { data } = await client.get<Pokemon[]>('/pokemon');
  return data;
}
