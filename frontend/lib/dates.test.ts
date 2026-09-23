import assert from "node:assert/strict";
import { test } from "node:test";
import { daysLeft } from "./dates.ts";

test("null deadline", () => assert.equal(daysLeft(null), null));
test("today is 0, tomorrow 1, yesterday -1 regardless of time of day", () => {
  const lateEvening = new Date(2026, 8, 23, 23, 30);
  assert.equal(daysLeft("2026-09-23", lateEvening), 0);
  assert.equal(daysLeft("2026-09-24", lateEvening), 1);
  assert.equal(daysLeft("2026-09-22", new Date(2026, 8, 23, 0, 5)), -1);
});
test("across month end", () => assert.equal(daysLeft("2026-10-01", new Date(2026, 8, 30, 12)), 1));
