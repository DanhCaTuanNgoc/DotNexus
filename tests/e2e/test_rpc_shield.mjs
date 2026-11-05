import { chromium } from '../../front-end/node_modules/playwright/index.mjs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    localStorage.setItem('dotnexus_onboarding_completed_v1', 'true');
    localStorage.setItem('dotnexus_tour_completed', 'true');
  });
  const page = await context.newPage();
  const responses = [];
  page.on('response', res => {
    if (res.url().includes('/api/')) {
      responses.push({ url: res.url(), status: res.status() });
      console.log(`[API ${res.status()}] ${res.url()}`);
    }
  });

  await page.goto('http://localhost:5173/#/shield', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click attack simulation button
  const drillBtns = page.locator('button[aria-label*="Inject"]');
  const count = await drillBtns.count();
  console.log(`Found ${count} attack drill buttons on RPC Shield.`);

  if (count > 0) {
    const firstDrill = drillBtns.first();
    const label = await firstDrill.getAttribute('aria-label');
    console.log(`Clicking drill: ${label}`);
    await firstDrill.click();
    await page.waitForTimeout(1500);
  }

  // Check Release IP button
  const unbanBtns = page.locator('button:has-text("RELEASE IP")');
  const unbanCount = await unbanBtns.count();
  console.log(`Found ${unbanCount} RELEASE IP buttons.`);
  if (unbanCount > 0) {
    console.log('Clicking RELEASE IP...');
    await unbanBtns.first().click();
    await page.waitForTimeout(1500);
  }

  console.log('Total responses recorded:', responses.length);
  await browser.close();
})();
