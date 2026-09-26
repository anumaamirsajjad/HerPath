import { chromium } from 'playwright-core';
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
const dir = process.env.TEMP + '/screenshots';
try {
  console.log('Going to localhost:3000');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'shot1.png' });
  await browser.close();
} catch(e) { console.error(e); }
