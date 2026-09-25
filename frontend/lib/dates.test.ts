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

import { formatDate } from "./dates.ts";

test("formatDate localizes month names and keeps the calendar day", () => {
  assert.equal(formatDate("2026-10-05", "en"), "5 October 2026");
  assert.match(formatDate("2026-10-05", "ur"), /اکتوبر/);
  assert.match(formatDate("2026-10-05", "ur"), /2026|۲۰۲۶/);
});
test("formatDate passes through empty", () => assert.equal(formatDate(null, "en"), ""));
