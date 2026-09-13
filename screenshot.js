const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  await page.goto('http://localhost:5177/auth');
  await page.screenshot({ path: 'screenshot_auth_desktop.png' });
  await browser.close();
})();
