// tests/global.setup.ts
import { chromium, FullConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import { S } from './utils/selectors';
dotenv.config();

const LOGIN_URL =
  'https://id.bettyblocks.com/oauth2/authorize' +
  '?url=https%3A%2F%2Fid.bettyblocks.com' +
  '&client_id=22222222-2222-2222-2222-222222222222' +
  '&redirect_uri=https%3A%2F%2Ffusionauth-dispatcher.betty.services%2Foauth%2Fbuilder' +
  '&response_type=code' +
  '&scope=offline_access' +
  '&state=c2dc14cbb4c94e37bc44dcb488adf209%2Cqa-assignment-ric%2C' +
  'https%3A%2F%2Fqa-assignment-ric.betty.app%2Fhome';

const APP_BASE = 'https://qa-assignment-ric.betty.app';

async function globalSetup(_config: FullConfig) {
  console.log('\n🔐 Betty Blocks OAuth2 login setup...');

  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to FusionAuth login page
    console.log('  → Opening login page...');
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
    const emailField = page.locator(S.auth.emailInput);
    const passwordField = page.locator(S.auth.passwordInput);
    const submitBtn = page.locator(S.auth.submit);

    await emailField.waitFor({ state: 'visible', timeout: 15_000 });

    console.log('  → Filling credentials...');
    await emailField.fill(process.env.TEST_EMAIL!);
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }
    await passwordField.waitFor({ state: 'visible', timeout: 15_000 });
    await passwordField.fill(process.env.TEST_PASSWORD!);
    await submitBtn.click();

    await page.waitForTimeout(3000); // Wait for potential redirects
    await passwordField.waitFor({ state: 'visible', timeout: 15_000 });

    if (await emailField.isVisible()) {
      await emailField.fill(process.env.TEST_EMAIL!);
      await passwordField.fill(process.env.TEST_PASSWORD!);
      console.log('  → Submitting and waiting for redirect...');
      await Promise.all([
        page.waitForURL(`${APP_BASE}/**`, { timeout: 45_000 }),
        submitBtn.click(),
      ]);
      // Submit — wait for full OAuth redirect chain to finish
    }

    console.log(`  ✅ Logged in — URL: ${page.url()}`);

    // Save session
    const authPath = process.env.AUTH_FILE ?? 'tests/.auth/user.json';
    await context.storageState({ path: authPath });
    console.log(`  ✅ Session saved to ${authPath}\n`);

  } catch (err) {
    console.error('  ❌ Login failed:', err);
    await page.screenshot({ path: 'tests/.auth/login-failure.png', fullPage: true });
    console.error('  📸 Screenshot → tests/.auth/login-failure.png\n');
    throw err;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
