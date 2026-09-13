const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:5177/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'screenshot_landing.png' });
  await browser.close();
})();

