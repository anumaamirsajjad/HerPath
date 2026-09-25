import { B, API, ok, user, open } from "./lib.mjs";
const tok = await user({ targetLevel: "masters", age: 23, domicile: "Punjab", interPercent: 78, level: "bachelors", yearsOfEducation: 16, cgpa: 3.4, monthlyIncome: 45000, universityType: "public", documents: { cnic: true } });
const { browser, page, errors } = await open(tok);

await page.goto(`${B}/en/checklist`);
await page.waitForSelector("text=My documents");
const passportRow = page.locator("li", { hasText: "Passport" });
const before = await passportRow.innerText();
ok(/Get this and \d+ more scholarships open up/.test(before), `passport unlock text: ${before.split("\n")[1]}`);
const firstDoc = await page.locator("main li label").first().innerText();
ok(firstDoc === "Passport" || /\d/.test(before), `highest-unlock document listed first: ${firstDoc}`);
await page.getByLabel("Passport").check();
await page.waitForFunction(() => ![...document.querySelectorAll("main li")].find((d) => d.querySelector("label")?.textContent === "Passport")?.textContent.includes("open up"));
ok(await page.getByLabel("Passport").isChecked(), "passport ticked and unlock text removed");
const prof = await (await fetch(`${API}/profile`, { headers: { Authorization: `Bearer ${(await page.evaluate(() => localStorage.getItem("access")))}` } })).json();
ok(prof.data.documents.passport === true && prof.data.age === 23, "PUT kept the rest of the profile");

for (const slug of ["peef-undergraduate", "fulbright-masters"]) {
  await page.goto(`${B}/en/scholarships/${slug}`);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("button", { name: "Saved", exact: true }).waitFor();
}
await page.goto(`${B}/en/saved`);
await page.waitForSelector("text=Saved scholarships");
ok(await page.getByText(/cannot be held together/).isVisible(), "conflict banner shown");
ok((await page.getByText("No deadline announced yet").count()) === 2, "no-deadline label for both");
await page.locator("article", { hasText: "PEEF" }).getByRole("button", { name: "Remove" }).click();
await page.waitForFunction(() => !document.body.innerText.includes("PEEF Undergraduate"));
ok(!(await page.getByText(/cannot be held together/).isVisible()), "conflict gone after removing one");
ok(errors.length === 0, `no page errors ${JSON.stringify(errors)}`);
await browser.close();
