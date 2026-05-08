/* eslint-disable */
import axios from 'axios';
import { Client } from 'pg';

module.exports = async function () {
  const host = process.env['HOST'] ?? 'localhost';
  const port = process.env['PORT'] ?? '3000';
  axios.defaults.baseURL = `http://${host}:${port}`;

  const client = new Client({
    host: process.env['DB_HOST'] ?? 'localhost',
    port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
    user: process.env['DB_USERNAME'] ?? 'admin',
    password: process.env['DB_PASSWORD'] ?? 'admin',
    database: process.env['DB_NAME'] ?? 'pokemon',
  });
  await client.connect();
  await client.query('TRUNCATE profile_pokemon, profile RESTART IDENTITY CASCADE');
  await client.end();
};
