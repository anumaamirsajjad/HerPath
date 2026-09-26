export type Status = "met" | "fixable" | "fixable_later" | "not_eligible";
export type Tab = "apply_now" | "ready" | "almost" | "future" | "not_eligible";
export type Msg = { en: string; ur?: string };

export interface ScholarshipRow {
  slug: string; provider: string; location: "pakistan" | "abroad"; country: string;
  levels: string[]; types: string[]; covers: string[]; funding: string;
  women_only: boolean; female_quota: boolean; allows_other_scholarship: boolean;
  university_type: string; provinces: string[]; income_limit: number | null;
  test_requirement: "required" | "waiver_possible" | "none"; special_categories: string[];
  usual_opening_month: number | null; status: "open" | "closed" | "expected";
  deadline: string | null; last_verified: string; name: string; summary: string;
}
export interface ScholarshipDetail extends ScholarshipRow {
  coverage: string; who_for: string; application_steps: string; family_summary: string;
  required_documents: string[]; requirements: unknown[]; official_link: string; next_check: string;
}
interface ResultBase { status: Status; message: Msg; missingFromProfile: boolean; conditionField?: string }
export interface LeafResult extends ResultBase {
  kind: "leaf"; field: string; fixGuide: string | null; daysNeeded: number | null; startBy: string | null;
}
export interface GroupResult extends ResultBase { kind: "anyOf" | "allOf"; options: Result[] }
export type Result = LeafResult | GroupResult;
export interface MatchResult {
  has_profile: boolean; scholarship: string; requirements: Result[];
  met_count: number; total_count: number; tab: Tab; score: number | null;
  missing_count: number; needs_info: boolean;
  deadline: string | null; deadline_estimated: boolean; is_open: boolean;
}
export interface MatchRow extends ScholarshipRow {
  score: number | null; met_count: number; total_count: number; gap_count: number; tab: Tab;
  missing_count: number; needs_info: boolean; effective_deadline: string | null; deadline_estimated: boolean;
}
export interface MatchList { has_profile: boolean; tabs: Record<Tab, MatchRow[]> }
export interface ProfileData {
  age?: number | null; domicile?: string | null; district?: string | null; categories?: string[];
  board?: string | null; matricPercent?: number | null; interPercent?: number | null; interStream?: string | null;
  cambridgeLevel?: string | null;  // "O-Levels" or "A-Levels" for Cambridge board
  cambridgeSubjects?: Record<string, string | null>;  // For Cambridge students: subject -> grade
  level?: string | null; targetLevel?: string | null; degree?: string | null; yearsOfEducation?: number | null; cgpa?: number | null;
  universityType?: string | null; enrolledUniversity?: string | null;
  tests?: Record<string, number | null>; monthlyIncome?: number | null; workYears?: number | null;
  volunteering?: boolean; leadership?: boolean; documents?: Record<string, boolean>;
  studyIn?: string | null; preferredCountries?: string[]; fields?: string[];
}
export interface Profile { data: ProfileData; analytics_opt_out: boolean; updated_at: string }
export interface User { id: number; email: string; has_profile: boolean }
export interface Guide { slug: string; title: string; days_needed: number; body: string }
export interface ChangeLogEntry { scholarship: string; date: string; source: string; note: string }
export interface SavedList { items: (ScholarshipRow & { saved_at: string })[]; conflicts: [string, string][] }
