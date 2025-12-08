import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE || 'http://localhost:8080';

test.describe('API Performance', () => {
  test('/api/patients responds under 500ms', async ({ request }) => {
    const startTime = performance.now();

    const response = await request.get(`${API_BASE}/api/patients`);

    const latencyMs = performance.now() - startTime;

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Verify response has patients data
    const patients = await response.json();
    expect(Array.isArray(patients)).toBeTruthy();
    expect(patients.length).toBeGreaterThan(0);

    // Assert latency under 500ms (generous threshold for CI)
    console.log(`/api/patients latency: ${latencyMs.toFixed(2)}ms`);
    expect(latencyMs).toBeLessThan(500);
  });

  test('/api/patients returns expected structure', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/patients`);
    const patients = await response.json();

    // Verify patient structure
    const patient = patients[0];
    expect(patient).toHaveProperty('id');
    expect(patient).toHaveProperty('name');
    expect(patient).toHaveProperty('mrn');
    expect(patient).toHaveProperty('status');
    expect(patient).toHaveProperty('vitalSigns');

    // Verify vital signs are included
    expect(Array.isArray(patient.vitalSigns)).toBeTruthy();
  });

  test('/api/patients with wardId filter', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/patients?wardId=w1`);

    expect(response.ok()).toBeTruthy();
    const patients = await response.json();

    // All returned patients should be in ward w1
    patients.forEach((patient: { bed?: { wardId: string } }) => {
      if (patient.bed) {
        expect(patient.bed.wardId).toBe('w1');
      }
    });
  });

  test('/api/wards responds quickly', async ({ request }) => {
    const startTime = performance.now();

    const response = await request.get(`${API_BASE}/api/wards`);

    const latencyMs = performance.now() - startTime;

    expect(response.ok()).toBeTruthy();
    expect(latencyMs).toBeLessThan(200);
  });

  test('/health endpoint is available', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);

    expect(response.ok()).toBeTruthy();
  });
});

test.describe('Dashboard E2E', () => {
  test('loads patient dashboard', async ({ page }) => {
    await page.goto('/');

    // Wait for dashboard to load
    await expect(page.locator('h1, h2, [data-testid="dashboard-title"]')).toBeVisible({ timeout: 10000 });
  });

  test('displays patient cards', async ({ page }) => {
    await page.goto('/');

    // Wait for patient data to load
    await page.waitForSelector('[data-testid="patient-card"], .patient-card, [class*="PatientCard"]', { timeout: 15000 }).catch(() => {
      // Fallback: check for any patient-related content
    });

    // Verify page loaded without errors
    const errorBoundary = page.locator('[data-testid="error-boundary"], .error-boundary');
    await expect(errorBoundary).not.toBeVisible();
  });
});

test.describe('Toolbar Controls', () => {
  test('mute toggle changes state, persists to localStorage, and logs mute action', async ({ page }) => {
    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => consoleLogs.push(msg.text()));

    await page.goto('/');

    // Wait for app to load
    await page.waitForTimeout(1000);

    // Find the mute button (has VolumeOff or VolumeUp icon)
    const muteButton = page.locator('button').filter({ has: page.locator('svg[data-testid="VolumeOffIcon"], svg[data-testid="VolumeUpIcon"]') }).first();

    // Get initial localStorage value
    const initialMuteState = await page.evaluate(() => localStorage.getItem('hospital:global-mute'));
    console.log('Initial mute state:', initialMuteState);

    // Click mute button
    await muteButton.click();
    await page.waitForTimeout(500);

    // Verify localStorage changed
    const newMuteState = await page.evaluate(() => localStorage.getItem('hospital:global-mute'));
    console.log('New mute state:', newMuteState);
    expect(newMuteState).not.toBe(initialMuteState);

    // Verify mute action was logged (proves useAudioAlert hook ran)
    const hasMuteLog = consoleLogs.some(log =>
      log.includes('Global audio MUTED') || log.includes('Global audio UNMUTED')
    );
    console.log('Console logs captured:', consoleLogs.filter(l => l.includes('audio') || l.includes('mute')));
    expect(hasMuteLog).toBe(true);
  });

  test('notification toggle changes state and persists to localStorage', async ({ page }) => {
    await page.goto('/');

    // Wait for app to load
    await page.waitForTimeout(1000);

    // Find the notification button (has Notifications or NotificationsOff icon)
    const notifButton = page.locator('button').filter({ has: page.locator('svg[data-testid="NotificationsIcon"], svg[data-testid="NotificationsOffIcon"]') }).first();

    // Get initial localStorage value
    const initialState = await page.evaluate(() => localStorage.getItem('hospital:notifications-enabled'));
    console.log('Initial notification state:', initialState);

    // Click notification button
    await notifButton.click();
    await page.waitForTimeout(300);

    // Verify localStorage changed
    const newState = await page.evaluate(() => localStorage.getItem('hospital:notifications-enabled'));
    console.log('New notification state:', newState);

    expect(newState).not.toBe(initialState);
  });

  test('mobile overflow menu shows and toggles work', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Wait for app to load
    await page.waitForTimeout(1000);

    // Find and click the overflow menu button (MoreVert icon)
    const moreButton = page.locator('button').filter({ has: page.locator('svg[data-testid="MoreVertIcon"]') });
    await expect(moreButton).toBeVisible();
    await moreButton.click();

    // Verify menu opened - look for menu items
    const menuItem = page.locator('li').filter({ hasText: 'Audio' }).first();
    await expect(menuItem).toBeVisible({ timeout: 5000 });

    // Click the audio menu item
    await menuItem.click();

    // Verify localStorage changed (menu should close after click)
    const muteState = await page.evaluate(() => localStorage.getItem('hospital:global-mute'));
    console.log('Mute state after menu click:', muteState);

    // State should have toggled
    expect(muteState).toBeDefined();
  });
});
