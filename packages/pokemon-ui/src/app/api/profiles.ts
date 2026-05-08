import client from './client';
import type { Profile, ProfileDetail } from '../types';

export async function getProfiles(): Promise<Profile[]> {
  const { data } = await client.get<Profile[]>('/profiles');
  return data;
}

export async function createProfile(name: string): Promise<Profile> {
  const { data } = await client.post<Profile>('/profiles', { name });
  return data;
}

export async function getProfile(id: number): Promise<ProfileDetail> {
  const { data } = await client.get<ProfileDetail>(`/profiles/${id}`);
  return data;
}

export async function updateTeam(id: number, pokemonIds: number[]): Promise<ProfileDetail> {
  const { data } = await client.put<ProfileDetail>(`/profiles/${id}/team`, { pokemonIds });
  return data;
}
