export interface Pokemon {
  id: number;
  name: string;
}

export interface Profile {
  id: number;
  name: string;
}

export interface ProfileDetail extends Profile {
  pokemon: Pokemon[];
}
