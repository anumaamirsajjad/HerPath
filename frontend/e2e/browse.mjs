import { B, ok, open } from "./lib.mjs";
const { browser, page, errors } = await open(null);
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

await page.goto(`${B}/en/scholarships`);
await page.waitForSelector("h3");
ok((await page.locator("h3").count()) === 17, "list shows 17 scholarships");
await page.click("summary");
await page.getByLabel("Abroad").check();
const abroad = await page.locator("h3").count();
ok(abroad === 11, `abroad filter → ${abroad}`);
await page.getByLabel("Women only").check();
ok((await page.locator("h3").count()) === 0, "women-only narrows to 0 (no seed row)");
await page.getByText("Clear filters").click();
ok((await page.locator("h3").count()) === 17, "clear restores 17");

await page.goto(`${B}/ur/scholarships`);
await page.waitForSelector("h3");
ok((await page.locator("html").getAttribute("dir")) === "rtl", "ur is rtl");
ok(await page.getByText("پیف انڈرگریجویٹ اسکالرشپ").isVisible(), "urdu name shown");

await page.goto(`${B}/en/scholarships/peef-undergraduate`);
await page.waitForSelector("h1");
ok((await page.locator("h1").innerText()) === "PEEF Undergraduate Scholarship", "detail title");
ok(await page.getByText("Usually opens in February").isVisible(), "usual opening month");
ok(await page.getByText("Log in and fill your profile").isVisible(), "logged-out gap prompt");
await page.getByText("Report a problem").click();
await page.fill("textarea", "e2e test report");
await page.getByRole("button", { name: "Report a problem" }).click();
await page.waitForSelector("text=Thank you");
ok(true, "report submitted");

await page.goto(`${B}/ur/guides/passport`);
await page.waitForSelector("h1");
ok((await page.locator("article h2").count()) >= 3, "guide headings rendered");
await page.goto(`${B}/en/guides/no-such-guide`);
await page.waitForSelector("text=Guide coming soon");
ok(true, "missing guide shows coming soon");

await page.goto(`${B}/en/changelog`);
await page.waitForSelector("li");
ok((await page.locator("li").count()) >= 17, "changelog entries");

// Server rendering: content and link-preview tags are in the HTML itself, before any JavaScript runs.
const html = await (await fetch(`${B}/ur/scholarships/peef-undergraduate`)).text();
ok(html.includes('property="og:title" content="پیف انڈرگریجویٹ اسکالرشپ"'), "detail page has Urdu og:title in server HTML");
ok(html.includes("<h1"), "detail content server-rendered");
const fam = await (await fetch(`${B}/ur/family/peef-undergraduate`)).text();
ok(fam.includes('og:description') && fam.includes("حکومتِ پنجاب"), "family page preview description in server HTML");
ok((await fetch(`${B}/en/scholarships/no-such-slug`)).status === 404, "unknown scholarship returns 404");
ok((await (await fetch(`${B}/en/scholarships`)).text()).includes("PEEF Undergraduate Scholarship"), "list server-rendered");
await page.goto(`${B}/ur/changelog`);
await page.waitForSelector("li");
ok(/ستمبر/.test(await page.locator("li").first().innerText()), "changelog dates in Urdu");

const real = errors.filter((e) => !e.includes("404") && !e.includes("429"));
ok(real.length === 0, `no console/page errors ${JSON.stringify(real)}`);
await browser.close();
