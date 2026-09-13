const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:5177/auth', { waitUntil: 'networkidle' });
  
  // Set light mode explicitly
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await page.waitForTimeout(500); // wait for transitions
  await page.screenshot({ path: 'screenshot_auth_light.png' });
  
  // Set dark mode explicitly
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshot_auth_dark.png' });
  
  await browser.close();
})();

