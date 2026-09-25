import type { ProfileData, ScholarshipRow } from "./types";

export interface FilterState {
  where: "" | "pakistan" | "abroad"; levels: string[]; types: string[]; funding: string[]; covers: string[];
  test: string[]; women: string[]; deadline: "" | "thisMonth" | "threeMonths";
  myProvince: boolean; myIncome: boolean; myCategories: boolean;
  q: string;
}
export const emptyFilters: FilterState = {
  where: "", levels: [], types: [], funding: [], covers: [], test: [], women: [], deadline: "",
  myProvince: false, myIncome: false, myCategories: false, q: "",
};

const any = (sel: string[], have: string[]) => sel.length === 0 || sel.some((s) => have.includes(s));
const all = (sel: string[], have: string[]) => sel.every((s) => have.includes(s));
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function applyFilters(rows: ScholarshipRow[], f: FilterState, profile?: ProfileData | null, today = new Date()): ScholarshipRow[] {
  const start = ymd(today);
  // Day 0 of month N+k is the last day of month N+k-1, so this never overflows into the next month.
  const end = ymd(new Date(today.getFullYear(), today.getMonth() + (f.deadline === "thisMonth" ? 1 : 3), 0));
  const q = f.q.trim().toLowerCase();
  return rows.filter((r) => {
    if (q && ![r.name, r.provider, r.country].some((v) => v.toLowerCase().includes(q))) return false;
    if (f.where && r.location !== f.where) return false;
    if (!any(f.levels, r.levels) || !any(f.types, r.types) || !any(f.funding, [r.funding]) || !any(f.test, [r.test_requirement])) return false;
    if (!all(f.covers, r.covers)) return false;
    if (f.women.length && !f.women.some((w) => (w === "women_only" ? r.women_only : r.female_quota))) return false;
    if (f.deadline && (!r.deadline || r.deadline < start || r.deadline > end)) return false;
    if (profile) {
      if (f.myProvince && r.provinces.length && profile.domicile && !r.provinces.includes(profile.domicile)) return false;
      if (f.myIncome && r.income_limit != null && profile.monthlyIncome != null && profile.monthlyIncome > r.income_limit) return false;
      if (f.myCategories && !(profile.categories ?? []).some((c) => r.special_categories.includes(c))) return false;
    }
    return true;
  });
}

/** How many filters are switched on (the search box is shown separately). */
export function activeCount(f: FilterState): number {
  const lists = [f.levels, f.types, f.funding, f.covers, f.test, f.women].reduce((n, l) => n + l.length, 0);
  return lists + (f.where ? 1 : 0) + (f.deadline ? 1 : 0) + [f.myProvince, f.myIncome, f.myCategories].filter(Boolean).length;
}
