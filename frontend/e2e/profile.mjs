import { B, API, ok, open } from "./lib.mjs";
const email = `e2e${Date.now()}@example.com`;
const { browser, page, errors } = await open(null);

await page.goto(`${B}/en/signup`);
await page.fill('input[type=email]', email);
await page.fill('input[type=password]', "pass12345");
await page.click("form button");
await page.waitForURL(/\/en\/profile/);
await page.waitForSelector("text=My profile");
ok(true, "signup redirects to profile");

await page.getByLabel("What do you want to study next?").selectOption("undergraduate");
await page.getByLabel("Age").pressSequentially("19");
ok((await page.getByLabel("Age").inputValue()) === "19", "typing keeps focus (age=19)");
await page.getByLabel("Province of domicile").selectOption("Punjab");
await page.getByLabel("Child of a BPS 1–4 government employee").check();
await page.getByText("School", { exact: true }).click();
await page.getByLabel("Intermediate %").pressSequentially("78.5");
await page.getByText("University", { exact: true }).click();
await page.getByLabel("Highest level (completed or in progress)").selectOption("intermediate");
await page.getByLabel("University type").selectOption("public");
await page.getByText("Finances", { exact: true }).click();
await page.getByLabel("Monthly household income (PKR)").pressSequentially("45000");
await page.getByText("Documents", { exact: true }).last().click();
await page.getByLabel("CNIC or B-Form").check();
await page.getByRole("button", { name: "Save" }).click();
await page.waitForURL(/\/en\/results/);
ok(true, "save redirects to results");

const token = await page.evaluate(() => localStorage.getItem("access"));
const prof = await (await fetch(`${API}/profile`, { headers: { Authorization: `Bearer ${token}` } })).json();
ok(prof.data.age === 19 && prof.data.interPercent === 78.5 && prof.data.domicile === "Punjab" && prof.data.monthlyIncome === 45000
   && prof.data.documents.cnic === true && prof.data.categories[0] === "bps1to4" && prof.data.level === "intermediate" && prof.data.targetLevel === "undergraduate", `saved profile ${JSON.stringify(prof.data).slice(0, 120)}`);

// reload keeps values
await page.goto(`${B}/ur/profile`);
await page.waitForSelector("text=میرا پروفائل");
ok((await page.getByLabel("عمر").inputValue()) === "19", "profile reloads values (ur)");
const sel = await page.getByLabel("ڈومیسائل کا صوبہ").evaluate((el) => el.options[el.selectedIndex].text);
ok(sel === "پنجاب", `urdu option label: ${sel}`);

// logout + mixed-case login
await page.goto(`${B}/en/scholarships`);
await page.getByRole("button", { name: "Log out" }).click();
await page.goto(`${B}/en/login`);
await page.fill('input[type=email]', email.toUpperCase());
await page.fill('input[type=password]', "pass12345");
await page.click("form button");
await page.waitForURL(/\/en\/results/);
ok(true, "mixed-case login works");

// wrong password shows readable error
await page.goto(`${B}/en/scholarships`);
await page.getByRole("button", { name: "Log out" }).click();
await page.goto(`${B}/en/login`);
await page.fill('input[type=email]', email);
await page.fill('input[type=password]', "wrongpass1");
await page.click("form button");
const alert = await page.locator('form [role=alert]').innerText();
ok(alert.includes("No active account") || alert.includes("credentials"), `login error readable: ${alert}`);

// settings: opt-out toggle + protected redirect when logged out
await page.goto(`${B}/en/settings`);
await page.waitForURL(/\/en\/login/);
ok(true, "settings redirects to login when logged out");
ok(errors.length === 0, `no page errors ${JSON.stringify(errors)}`);
console.log("EMAIL", email);
await browser.close();
