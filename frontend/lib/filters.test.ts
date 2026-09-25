import assert from "node:assert/strict";
import { test } from "node:test";
import { activeCount, applyFilters, emptyFilters, type FilterState } from "./filters.ts";
import type { ScholarshipRow } from "./types.ts";

const base: ScholarshipRow = {
  slug: "a", provider: "p", location: "pakistan", country: "Pakistan", levels: ["undergraduate"], types: ["need"],
  covers: ["tuition"], funding: "partial", women_only: false, female_quota: false, allows_other_scholarship: false,
  university_type: "any", provinces: [], income_limit: 60000, test_requirement: "none", special_categories: [],
  usual_opening_month: 2, status: "expected", deadline: null, last_verified: "2026-09-23", name: "A", summary: "",
};
const rows: ScholarshipRow[] = [
  base,
  { ...base, slug: "b", location: "abroad", levels: ["masters"], types: ["merit"], covers: ["tuition", "airfare"], funding: "full", test_requirement: "required", provinces: ["Sindh"], income_limit: null, deadline: "2026-10-10", women_only: true },
];
const f = (o: Partial<FilterState>): FilterState => ({ ...emptyFilters, ...o });
const today = new Date("2026-09-23");
const slugs = (r: ScholarshipRow[]) => r.map((x) => x.slug);

test("no filters returns all", () => assert.equal(applyFilters(rows, emptyFilters).length, 2));
test("where", () => assert.deepEqual(slugs(applyFilters(rows, f({ where: "abroad" }))), ["b"]));
test("level and type", () => {
  assert.deepEqual(slugs(applyFilters(rows, f({ levels: ["masters"] }))), ["b"]);
  assert.deepEqual(slugs(applyFilters(rows, f({ types: ["need"] }))), ["a"]);
});
test("covers requires every selected", () => assert.deepEqual(slugs(applyFilters(rows, f({ covers: ["tuition", "airfare"] }))), ["b"]));
test("funding, test, women", () => {
  assert.deepEqual(slugs(applyFilters(rows, f({ funding: ["full"] }))), ["b"]);
  assert.deepEqual(slugs(applyFilters(rows, f({ test: ["none"] }))), ["a"]);
  assert.deepEqual(slugs(applyFilters(rows, f({ women: ["women_only"] }))), ["b"]);
});
test("deadline windows", () => {
  assert.deepEqual(slugs(applyFilters(rows, f({ deadline: "thisMonth" }), null, today)), []);
  assert.deepEqual(slugs(applyFilters(rows, f({ deadline: "threeMonths" }), null, today)), ["b"]);
});
test("deadline window at month end does not skip a month", () => {
  const jan31 = new Date("2027-01-31");
  const r = [{ ...base, deadline: "2027-02-15" }];
  assert.deepEqual(slugs(applyFilters(r, f({ deadline: "thisMonth" }), null, jan31)), []);
  assert.deepEqual(slugs(applyFilters(r, f({ deadline: "threeMonths" }), null, jan31)), ["a"]);
});
test("profile-aware filters", () => {
  const profile = { domicile: "Punjab", monthlyIncome: 80000, categories: ["orphan"] };
  assert.deepEqual(slugs(applyFilters(rows, f({ myProvince: true }), profile)), ["a"]);
  assert.deepEqual(slugs(applyFilters(rows, f({ myIncome: true }), profile)), ["b"]);
  assert.deepEqual(slugs(applyFilters([{ ...base, special_categories: ["orphan"] }, rows[1]], f({ myCategories: true }), profile)), ["a"]);
});

test("search matches name, provider or country, ignoring case", () => {
  assert.deepEqual(slugs(applyFilters([base, { ...base, slug: "b", country: "Japan" }], f({ q: "japan" }))), ["b"]);
  assert.deepEqual(slugs(applyFilters([{ ...base, name: "Fulbright Master's" }], f({ q: "FULB" }))), ["a"]);
  assert.deepEqual(slugs(applyFilters([{ ...base, provider: "HEC" }], f({ q: "hec" }))), ["a"]);
  assert.deepEqual(slugs(applyFilters(rows, f({ q: "  " }))), ["a", "b"]);
});
test("activeCount counts chosen filters, not the search", () => {
  assert.equal(activeCount(f({ where: "abroad", levels: ["masters", "phd"], myIncome: true, q: "x" })), 4);
});
