import { test, expect } from '@playwright/test';

test('starts without a Google Maps API key and loads departures', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.route('https://transport.opendata.ch/v1/stationboard**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      stationboard: [{
        number: '14', category: 'T', to: 'Seebach',
        stop: { departure: new Date(Date.now() + 10 * 60_000).toISOString() }
      }]
    }) })
  );
  await page.route('https://transport.opendata.ch/v1/locations**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"stations":[]}' })
  );
  await page.goto('/');
  await expect(page.locator('#status')).not.toContainText('JavaScript wird gestartet', { timeout: 10000 });
  await expect(page.locator('#board')).toContainText('Seebach', { timeout: 10000 });
  expect(errors).toEqual([]);
  await page.locator('#manualMode').click();
  await expect(page.locator('#manualMode')).toHaveAttribute('aria-selected', 'true');
  await page.locator('#gpsMode').click();
  await expect(page.locator('#gpsMode')).toHaveAttribute('aria-selected', 'true');
  expect(errors).toEqual([]);
});


test('restores the manual tab selection and search text after reload without leaking into GPS', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    if (sessionStorage.getItem('tab-test-seeded')) return;
    sessionStorage.setItem('tab-test-seeded', '1');
    localStorage.clear();
    localStorage.setItem('fahrplan-state-v2', JSON.stringify({
      gps: { selected: { id: '8503610', name: 'Zürich, Triemli' }, stops: [], index: 0 },
      manual: { selected: { id: '8503000', name: 'Zürich HB' }, stops: [], index: 0, manualLocation: 'Zürich HB' }
    }));
  });
  await page.route('https://transport.opendata.ch/v1/stationboard**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"stationboard":[]}' })
  );
  await page.route('https://transport.opendata.ch/v1/locations**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"stations":[]}' })
  );
  await page.goto('/');
  await expect(page.locator('#status')).not.toContainText('JavaScript wird gestartet');
  await page.locator('#manualMode').click();
  await expect(page.locator('#stopSearch')).toHaveValue('Zürich HB');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('fahrplan-state-v2')).manual.selected.name)).toBe('Zürich HB');
  await page.locator('#gpsMode').click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('fahrplan-state-v2')).gps.selected.name)).toBe('Zürich, Triemli');
  await page.reload();
  await page.locator('#manualMode').click();
  await expect(page.locator('#stopSearch')).toHaveValue('Zürich HB');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('fahrplan-state-v2')).manual.selected.name)).toBe('Zürich HB');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('fahrplan-state-v2')).gps.selected.name)).toBe('Zürich, Triemli');
  expect(errors).toEqual([]);
});
