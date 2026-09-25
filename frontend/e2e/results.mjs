import { execSync } from "node:child_process";
import { B, ok, user, open } from "./lib.mjs";
import { existsSync } from "node:fs";
const BACKEND = new URL("../../backend", import.meta.url).pathname;
// Local virtualenv if there is one (CI, manual setup); otherwise the docker compose backend container.
const MANAGE = process.env.E2E_MANAGE ?? (existsSync(`${BACKEND}/.venv`)
  ? `cd ${BACKEND} && DEBUG=1 .venv/bin/python manage.py`
  : `cd ${BACKEND}/.. && docker compose exec -T backend python manage.py`);
const dj = (py) => execSync(`${MANAGE} shell -c "${py}"`, { env: process.env });

const tok = await user({ targetLevel: "undergraduate", age: 19, domicile: "Punjab", interPercent: 78, level: "intermediate", monthlyIncome: 45000, universityType: "public", documents: { cnic: true } });
const { browser, page, errors } = await open(tok);

await page.goto(`${B}/en/results`);
await page.waitForSelector("[role=tab]");
await page.getByRole("tab", { name: /Almost there/ }).click();
const almost = await page.locator("[role=tabpanel] h3").allInnerTexts();
ok(almost.includes("PEEF Undergraduate Scholarship"), `PEEF in Almost there (${almost.length} rows)`);
const peefCard = page.locator("[role=tabpanel] article", { hasText: "PEEF Undergraduate" });
ok((await peefCard.innerText()).includes("2 gaps"), "PEEF shows 2 gaps");

await page.getByRole("link", { name: "PEEF Undergraduate Scholarship" }).click();
await page.waitForSelector("text=4 of 6 requirements met");
ok(true, "detail shows 4 of 6 met (target level counted)");
ok(await page.getByText(/estimated from the usual opening month/).isVisible(), "estimated next deadline shown");
ok((await page.locator('[aria-label=fixable]').count()) === 2, "two ⚠️ fixable gaps");
ok(await page.locator('a[href="/en/guides/income-certificate"]').isVisible(), "income certificate guide link");

// Hard deadline 5 days out: 14-day gaps become fixable_later and PEEF moves to Future goals.
const d = new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10);
dj(`from scholarships.models import Scholarship as S; S.objects.filter(slug='peef-undergraduate').update(deadline='${d}', status='open')`);
try {
  await page.reload();
  await page.waitForSelector("text=requirements met");
  ok((await page.locator('[aria-label=fixable_later]').count()) === 2, "both gaps ⏳ fixable later with near deadline");
  ok(await page.getByText(/Start by \d{1,2} [A-Z][a-z]+ \d{4}/).first().isVisible(), "start-by date shown");
  await page.goto(`${B}/en/results`);
  await page.getByRole("tab", { name: /Future goals/ }).click();
  ok((await page.locator("[role=tabpanel] h3").allInnerTexts()).includes("PEEF Undergraduate Scholarship"), "PEEF moved to Future goals");
} finally {
  dj(`from scholarships.models import Scholarship as S; S.objects.filter(slug='peef-undergraduate').update(deadline=None, status='expected')`);
}

// Undergraduate awards are not offered to a PhD applicant.
const phd = await user({ targetLevel: "phd", age: 30, domicile: "Punjab", interPercent: 80, monthlyIncome: 20000, universityType: "public", documents: { cnic: true, domicile: true, incomeCertificate: true } });
await page.evaluate((t) => { localStorage.setItem("access", t.access); localStorage.setItem("refresh", t.refresh); }, phd);
await page.goto(`${B}/en/results`);
await page.waitForSelector("[role=tab]");
const shown = (await page.locator("[role=tabpanel] h3").allInnerTexts()).join("|");
ok(!shown.includes("PEEF"), "PhD applicant is not offered PEEF");

// Missing data → needs-info section, not rejection; asks what she wants to study next.
const tok2 = await user({ domicile: "Punjab", monthlyIncome: 45000, age: 19, documents: {} });  // no targetLevel, no Inter %
await page.evaluate((t) => { localStorage.setItem("access", t.access); localStorage.setItem("refresh", t.refresh); }, tok2);
await page.goto(`${B}/en/results`);
await page.waitForSelector("text=Needs more information");
const needs = page.locator("section", { has: page.getByRole("heading", { name: /Needs more information/ }) });
ok((await needs.innerText()).includes("PEEF Undergraduate Scholarship"), "PEEF under needs-info when Inter % missing");
await page.goto(`${B}/en/scholarships/turkiye-burslari`);
await page.waitForSelector("text=Add what you want to study next");
ok(true, "asks what she wants to study next");

// Urdu rendering of results
await page.goto(`${B}/ur/results`);
await page.waitForSelector("[role=tab]");
ok((await page.getByRole("tab").first().innerText()).includes("ابھی درخواست دیں"), "urdu tabs");
ok(errors.length === 0, `no page errors ${JSON.stringify(errors)}`);
await browser.close();
