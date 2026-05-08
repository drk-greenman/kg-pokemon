import { test, expect, request } from '@playwright/test';

let profileId: number;

test.beforeAll(async () => {
  const apiContext = await request.newContext();
  const response = await apiContext.post('http://localhost:3000/api/profiles', {
    data: { name: 'E2E Team Test' },
  });
  const profile = await response.json();
  profileId = profile.id;
  await apiContext.dispose();
});

test('app bar shows the profile name', async ({ page }) => {
  await page.goto(`/profiles/${profileId}`);
  await expect(page.getByRole('img', { name: 'bulbasaur' })).toBeVisible();
  await expect(page.getByText('E2E Team Test')).toBeVisible();
});

test('Pokemon grid loads all 150 Pokemon cards', async ({ page }) => {
  await page.goto(`/profiles/${profileId}`);
  await expect(page.getByRole('img', { name: 'bulbasaur' })).toBeVisible();
  // 150 pokemon sprites; profile starts empty so no Slot images exist yet
  await expect(page.locator('img')).toHaveCount(150);
});

test('selecting a Pokemon adds it to the team row (slot fills with sprite)', async ({ page }) => {
  await page.goto(`/profiles/${profileId}`);
  await expect(page.getByRole('img', { name: 'bulbasaur' })).toBeVisible();
  await page.getByRole('img', { name: 'bulbasaur' }).click();
  await expect(page.getByRole('img', { name: 'Slot 1' })).toBeVisible();
});

test('selecting a second Pokemon fills a second slot', async ({ page }) => {
  await page.goto(`/profiles/${profileId}`);
  await expect(page.getByRole('img', { name: 'bulbasaur' })).toBeVisible();
  await page.getByRole('img', { name: 'bulbasaur' }).click();
  await page.getByRole('img', { name: 'ivysaur' }).click();
  await expect(page.getByRole('img', { name: 'Slot 1' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Slot 2' })).toBeVisible();
});

test('adding the same Pokemon twice fills two slots and shows a ×2 badge on its card', async ({ page }) => {
  await page.goto(`/profiles/${profileId}`);
  await expect(page.getByRole('img', { name: 'bulbasaur' })).toBeVisible();
  await page.getByRole('img', { name: 'bulbasaur' }).click();
  await page.getByRole('img', { name: 'bulbasaur' }).click();
  await expect(page.getByRole('img', { name: 'Slot 1' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Slot 2' })).toBeVisible();
  await expect(page.getByText('×2')).toBeVisible();
});

test('clicking a filled slot in the team row removes that Pokemon (slot becomes empty)', async ({ page }) => {
  await page.goto(`/profiles/${profileId}`);
  await expect(page.getByRole('img', { name: 'bulbasaur' })).toBeVisible();
  await page.getByRole('img', { name: 'bulbasaur' }).click();
  await expect(page.getByRole('img', { name: 'Slot 1' })).toBeVisible();
  // Click the team row button that wraps Slot 1 to remove it
  await page.locator('button', { has: page.locator('img[alt="Slot 1"]') }).click();
  await expect(page.getByRole('img', { name: 'Slot 1' })).not.toBeVisible();
});

test('selecting 6 Pokemon causes grid cards to become visually disabled (opacity reduced)', async ({ page }) => {
  await page.goto(`/profiles/${profileId}`);
  await expect(page.getByRole('img', { name: 'bulbasaur' })).toBeVisible();
  await page.getByRole('img', { name: 'bulbasaur' }).click();
  await page.getByRole('img', { name: 'ivysaur' }).click();
  await page.getByRole('img', { name: 'venusaur' }).click();
  await page.getByRole('img', { name: 'charmander' }).click();
  await page.getByRole('img', { name: 'charmeleon' }).click();
  await page.getByRole('img', { name: 'charizard' }).click();
  // Grid is at cap — squirtle's card should have opacity 0.4
  await expect(
    page.locator('button', { has: page.locator('img[alt="squirtle"]') })
  ).toHaveCSS('opacity', '0.4');
});

test('clicking a card when at cap does not add a 7th Pokemon to the team row', async ({ page }) => {
  await page.goto(`/profiles/${profileId}`);
  await expect(page.getByRole('img', { name: 'bulbasaur' })).toBeVisible();
  await page.getByRole('img', { name: 'bulbasaur' }).click();
  await page.getByRole('img', { name: 'ivysaur' }).click();
  await page.getByRole('img', { name: 'venusaur' }).click();
  await page.getByRole('img', { name: 'charmander' }).click();
  await page.getByRole('img', { name: 'charmeleon' }).click();
  await page.getByRole('img', { name: 'charizard' }).click();
  // At cap — click squirtle; it should not be added
  await page.getByRole('img', { name: 'squirtle' }).click();
  // All 6 slots filled, no 7th slot (TeamRow only ever has 6 slot buttons)
  await expect(page.locator('img[alt^="Slot"]')).toHaveCount(6);
});

// Tests 9-12 accumulate DB state:
//   Test 9  saves team [bulbasaur, ivysaur]
//   Test 11 saves team [bulbasaur, ivysaur, venusaur, charmander, charmeleon, charizard]

test('saving a partial team (fewer than 6) navigates back to /', async ({ page }) => {
  await page.goto(`/profiles/${profileId}`);
  await expect(page.getByRole('img', { name: 'bulbasaur' })).toBeVisible();
  await page.getByRole('img', { name: 'bulbasaur' }).click();
  await page.getByRole('img', { name: 'ivysaur' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL('/');
});

test('navigating back to the profile shows the saved partial team', async ({ page }) => {
  await page.goto(`/profiles/${profileId}`);
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('img', { name: 'Slot 1' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Slot 2' })).toBeVisible();
  // Slot 3 should be empty (no img with alt="Slot 3")
  await expect(page.getByRole('img', { name: 'Slot 3' })).not.toBeVisible();
});

test('saving a full team (6 Pokemon) navigates back to /', async ({ page }) => {
  await page.goto(`/profiles/${profileId}`);
  await expect(page.getByRole('img', { name: 'bulbasaur' })).toBeVisible();
  // Profile loads with bulbasaur + ivysaur from test 9. Add 4 more to reach 6.
  await page.getByRole('img', { name: 'venusaur' }).click();
  await page.getByRole('img', { name: 'charmander' }).click();
  await page.getByRole('img', { name: 'charmeleon' }).click();
  await page.getByRole('img', { name: 'charizard' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL('/');
});

test('navigating back to the profile shows the saved full team', async ({ page }) => {
  await page.goto(`/profiles/${profileId}`);
  await page.waitForLoadState('networkidle');
  for (let i = 1; i <= 6; i++) {
    await expect(page.getByRole('img', { name: `Slot ${i}` })).toBeVisible();
  }
});
