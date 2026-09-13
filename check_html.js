const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5177/', { waitUntil: 'networkidle' });
  const html = await page.content();
  console.log('Number of headers:', (html.match(/<header/g) || []).length);
  await browser.close();
})();

