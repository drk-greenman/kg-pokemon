import { test, expect } from '@playwright/test';
import { Client } from 'pg';

const PROFILE_1 = 'Ash';
const PROFILE_2 = 'Misty';

// Each browser project runs this spec in its own worker; truncate so every
// browser starts with a clean DB regardless of what previous browsers left behind.
test.beforeAll(async () => {
  const client = new Client({
    host: process.env['DB_HOST'] ?? 'localhost',
    port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
    user: process.env['DB_USERNAME'] ?? 'admin',
    password: process.env['DB_PASSWORD'] ?? 'admin',
    database: process.env['DB_NAME'] ?? 'pokemon',
  });
  await client.connect();
  try {
    await client.query('TRUNCATE profile_pokemon, profile RESTART IDENTITY CASCADE');
  } finally {
    await client.end();
  }
});

test('app bar shows "Pokémon Team Builder"', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Pokémon Team Builder')).toBeVisible();
});

test('shows "+ New Profile" button when list is empty; no profile rows visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '+ New Profile' })).toBeVisible();
  // With empty DB, the only button on the page is "+ New Profile"
  await expect(page.getByRole('button')).toHaveCount(1);
});

test('clicking "+ New Profile" opens the dialog with a "Profile name" field', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '+ New Profile' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByLabel('Profile name')).toBeVisible();
});

test('Create button is disabled when name field is blank; enabled after typing', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '+ New Profile' }).click();
  await expect(page.getByRole('button', { name: 'Create' })).toBeDisabled();
  await page.getByLabel('Profile name').fill(PROFILE_1);
  await expect(page.getByRole('button', { name: 'Create' })).toBeEnabled();
});

// Tests 5-7 accumulate DB state: PROFILE_1 created in test 5, PROFILE_2 created in test 6.

test('creating a profile closes the dialog and adds the profile to the list', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '+ New Profile' }).click();
  await page.getByLabel('Profile name').fill(PROFILE_1);
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: PROFILE_1 })).toBeVisible();
});

test('creating a second profile adds it to the already-populated list; both appear', async ({ page }) => {
  await page.goto('/');
  // PROFILE_1 is in the DB from the previous test
  await expect(page.getByRole('button', { name: PROFILE_1 })).toBeVisible();
  await page.getByRole('button', { name: '+ New Profile' }).click();
  await page.getByLabel('Profile name').fill(PROFILE_2);
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('button', { name: PROFILE_1 })).toBeVisible();
  await expect(page.getByRole('button', { name: PROFILE_2 })).toBeVisible();
});

test('clicking a profile row navigates to /profiles/:id', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: PROFILE_1 })).toBeVisible();
  await page.getByRole('button', { name: PROFILE_1 }).click();
  await expect(page).toHaveURL(/\/profiles\/\d+/);
});
