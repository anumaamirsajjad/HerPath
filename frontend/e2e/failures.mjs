import { B, API, ok, user, open } from "./lib.mjs";
const tok = await user({ age: 20, domicile: "Punjab", documents: { cnic: true } });
const { browser, page, errors } = await open(tok);
const fail = (method) => async (route) => (route.request().method() === method ? route.fulfill({ status: 500, body: "{}" }) : route.continue());

// 1. Profile load failure must not show an empty, saveable form.
await page.route("**/api/profile", fail("GET"));
await page.goto(`${B}/en/profile`);
await page.waitForSelector("main [role=alert]", { timeout: 10000 }).catch(() => {});
ok(await page.locator("main [role=alert]").isVisible().catch(() => false), "profile load error shown");
ok((await page.getByRole("button", { name: "Save" }).count()) === 0, "no Save button when profile failed to load");
await page.unroute("**/api/profile");
const prof = await (await fetch(`${API}/profile`, { headers: { Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem("access"))}` } })).json();
ok(prof.data.age === 20, "profile intact");

// 2. Opt-out PATCH failure must revert the checkbox and say so.
await page.route("**/api/profile", fail("PATCH"));
await page.goto(`${B}/en/settings`);
const box = page.getByRole("checkbox");
await box.waitFor();
await box.click();
await page.waitForTimeout(800);
ok(await box.isChecked(), "opt-out checkbox reverted after failed save");
ok(await page.locator("main [role=alert]").isVisible().catch(() => false), "opt-out error shown");
await page.unroute("**/api/profile");

// 3. Expired session (refresh rejected) sends her to login instead of a broken page.
await page.evaluate(() => { localStorage.setItem("access", "garbage"); localStorage.setItem("refresh", "garbage"); });
await page.goto(`${B}/en/scholarships`);
await page.goto(`${B}/en/results`);
await page.waitForURL(/\/en\/login/, { timeout: 10000 }).catch(() => {});
ok(page.url().includes("/en/login"), `expired session redirects to login (${page.url()})`);
// Logging out revokes the refresh token on the server.
const t2 = await user({ targetLevel: "undergraduate" });
await page.evaluate((t) => { localStorage.setItem("access", t.access); localStorage.setItem("refresh", t.refresh); }, t2);
await page.goto(`${B}/en/scholarships`);
await page.getByRole("button", { name: "Log out" }).click();
await page.waitForTimeout(800);
const again = await fetch(`${API}/auth/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh: t2.refresh }) });
ok(again.status === 401, "refresh token revoked after logout");
ok(errors.length === 0, `no page errors ${JSON.stringify(errors)}`);
await browser.close();
