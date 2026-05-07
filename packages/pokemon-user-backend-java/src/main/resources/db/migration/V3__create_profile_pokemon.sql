CREATE TABLE IF NOT EXISTS profile_pokemon (
    id         SERIAL  PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES profile(id),
    pokemon_id INTEGER NOT NULL REFERENCES pokemon(id)
);
