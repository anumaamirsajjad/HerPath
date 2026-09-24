import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

const store = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k),
};
let refreshCalls = 0;
let refreshOk = true;
globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
  const url = String(input);
  if (url.endsWith("/auth/refresh")) {
    refreshCalls++;
    await new Promise((r) => setTimeout(r, 10));
    return refreshOk ? Response.json({ access: "new", refresh: "r2" }) : Response.json({ detail: "blacklisted" }, { status: 401 });
  }
  const auth = new Headers(init?.headers).get("Authorization");
  return auth === "Bearer new" ? Response.json({ ok: true }) : Response.json({ detail: "expired" }, { status: 401 });
}) as typeof fetch;

const { api, authEvents } = await import("./api.ts");

beforeEach(() => { store.clear(); store.set("access", "old"); store.set("refresh", "r1"); refreshCalls = 0; refreshOk = true; });

test("parallel 401s share one refresh", async () => {
  const out = await Promise.all([api("a"), api("b"), api("c")]);
  assert.deepEqual(out, [{ ok: true }, { ok: true }, { ok: true }]);
  assert.equal(refreshCalls, 1);
  assert.equal(store.get("refresh"), "r2");
});

test("failed refresh clears tokens and announces logout", async () => {
  refreshOk = false;
  let loggedOut = 0;
  authEvents.addEventListener("logout", () => loggedOut++);
  await assert.rejects(api("a"), (e: { status: number }) => e.status === 401);
  assert.equal(store.get("access"), undefined);
  assert.equal(loggedOut, 1);
});
