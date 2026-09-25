// Browser smoke tests. They drive the locally installed Google Chrome against running servers:
//   E2E_WEB (default http://localhost:3000) and E2E_API (default http://localhost:8000/api), seeded with `manage.py seed`.
import { chromium } from "playwright-core";
export const B = process.env.E2E_WEB ?? "http://localhost:3000";
export const API = process.env.E2E_API ?? "http://localhost:8000/api";
export const ok = (c, m) => { console.log(c ? "ok  " : "FAIL", m); if (!c) process.exitCode = 1; };
export async function user(data) {
  const email = `e2e${Date.now()}${Math.random().toString(36).slice(2, 6)}@example.com`;
  const tok = await (await fetch(`${API}/auth/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "pass12345" }) })).json();
  if (data) await fetch(`${API}/profile`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok.access}` }, body: JSON.stringify({ data }) });
  return { ...tok, email };
}
export async function open(tok) {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${B}/en`);
  if (tok) await page.evaluate((t) => { localStorage.setItem("access", t.access); localStorage.setItem("refresh", t.refresh); }, tok);
  return { browser, page, errors };
}
