CREATE TABLE IF NOT EXISTS profile (
    id      SERIAL      PRIMARY KEY,
    name    VARCHAR(50) NOT NULL,
    version BIGINT      NOT NULL DEFAULT 0
);
