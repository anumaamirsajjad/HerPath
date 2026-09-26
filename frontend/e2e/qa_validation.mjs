import { chromium } from "playwright-core";
import { open, ok, B, API } from "./lib.mjs";

async function testValidation() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log("\n=== PHASE 2: INPUT VALIDATION TESTS ===\n");
  
  // Test 1: Valid profile - Intermediate
  console.log("Test 1: VALID Intermediate profile");
  await open(page, "/en/profile");
  await page.fill('input[name="age"]', "18");
  await page.selectOption('select[name="domicile"]', "Punjab");
  await page.fill('input[name="district"]', "Lahore");
  await page.selectOption('select[name="board"]', "bise_punjab");
  await page.fill('input[name="matricPercent"]', "85");
  await page.fill('input[name="interPercent"]', "88");
  await page.selectOption('select[name="interStream"]', "ics");
  await page.click('button[type="submit"]'); // next
  await page.click('button[type="submit"]'); // next (skip school)
  await page.selectOption('select[name="level"]', "bachelors");
  await page.click('button[type="submit"]'); // next (university)
  await page.fill('input[name="tests.ecat"]', "150");
  let saveResp = await page.waitForResponse(resp => resp.url().includes('/api/profile') && resp.status() < 400);
  console.log(`  Status: ${saveResp.status()} - Profile saved`);
  
  // Test 2: Invalid age (999)
  console.log("\nTest 2: INVALID - Age=999 (should fail, max=70)");
  await page.goto(`http://localhost:3000/en/profile`);
  await page.fill('input[name="age"]', "999");
  await page.selectOption('select[name="domicile"]', "Punjab");
  await page.fill('input[name="district"]', "Lahore");
  await page.selectOption('select[name="board"]', "bise_punjab");
  await page.fill('input[name="matricPercent"]', "85");
  await page.fill('input[name="interPercent"]', "88");
  await page.selectOption('select[name="interStream"]', "ics");
  await page.click('button[type="submit"]'); // next
  await page.click('button[type="submit"]'); // next (skip school)
  await page.selectOption('select[name="level"]', "bachelors");
  await page.click('button[type="submit"]'); // next
  // Should see an error
  let errorMsg = await page.locator('[role="alert"]').textContent({ timeout: 5000 }).catch(() => "No error shown");
  console.log(`  Error message: ${errorMsg}`);
  
  await browser.close();
}

testValidation().catch(console.error);
