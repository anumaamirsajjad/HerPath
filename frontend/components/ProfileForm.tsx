"use client";
import { ArrowLeft, ArrowRight, Banknote, Briefcase, Check, FileCheck2, GraduationCap, Heart, NotebookPen, School, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { ErrorNote, Loading, PageTitle, btn, card, field } from "@/components/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import * as C from "@/lib/choices";
import type { Profile, ProfileData } from "@/lib/types";

const STEPS = ["personal", "school", "university", "tests", "finances", "experience", "documents", "preferences"] as const;
const EMPTY: ProfileData = { categories: [], tests: {}, documents: {}, cambridgeSubjects: {}, preferredCountries: [], fields: [] };
const num = (v: string) => (v === "" ? null : Number(v));
const input = field;
const STEP_ICON = { personal: UserRound, school: School, university: GraduationCap, tests: NotebookPen, finances: Banknote, experience: Briefcase, documents: FileCheck2, preferences: Heart } as const;
// Real-world max bounds for standardized tests
const TEST_BOUNDS: Record<string, number> = { ielts: 9, toefl: 120, gre: 340, mdcat: 200, ecat: 300, nat: 200, gat: 100, hat: 100, duolingo: 160 };
const STEP_FIELDS: Record<(typeof STEPS)[number], (keyof ProfileData)[]> = {
  personal: ["targetLevel", "age", "domicile", "district", "categories"], school: ["board", "matricPercent", "interPercent", "interStream"],
  university: ["level", "degree", "yearsOfEducation", "cgpa", "universityType", "enrolledUniversity"], tests: ["tests"], finances: ["monthlyIncome"],
  experience: ["workYears", "volunteering", "leadership"], documents: ["documents"], preferences: ["studyIn", "preferredCountries", "fields"],
};
const filled = (v: unknown) => v != null && v !== "" && v !== false && !(Array.isArray(v) && !v.length) && !(typeof v === "object" && !Array.isArray(v) && !Object.values(v as object).some((x) => x != null && x !== false));
/** A tappable chip that is a real checkbox underneath. */
function ChipBox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={`relative flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 font-bold transition has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-saffron ${checked ? "border-leaf bg-leaf-soft text-leaf" : "border-line bg-card hover:border-indigo"}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="absolute inset-0 cursor-pointer opacity-0" />
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 ${checked ? "border-leaf bg-leaf text-white" : "border-line"}`}>{checked && <Check className="pop h-4 w-4" />}</span>{label}
    </label>
  );
}

export default function ProfileForm() {
  const t = useTranslations("profile");
  const tf = useTranslations("profile.fields");
  const td = useTranslations("documents");
  const to = useTranslations("options");
  const c = useTranslations("common");
  const router = useRouter();
  const { refresh } = useAuth();
  const [d, setD] = useState<ProfileData>(EMPTY);
  const [loaded, setLoaded] = useState<boolean | "error">(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    // Only a 404 means "no profile yet". Any other failure must not show an empty form she could save over her data.
    api<Profile>("profile")
      .then((p) => { setD({ ...EMPTY, ...p.data }); setLoaded(true); })
      .catch((e) => setLoaded(e instanceof ApiError && e.status === 404 ? true : "error"));
  }, []);
  const set = <K extends keyof ProfileData>(k: K, v: ProfileData[K]) => setD((prev) => ({ ...prev, [k]: v }));

  // Plain render helpers (not components) so inputs keep focus across re-renders.
  const numField = (k: keyof ProfileData, step = "1", max?: number) => (
    <label key={k} className="block font-bold">{tf(k)}
      <input type="number" inputMode="decimal" step={step} min={0} max={max} value={(d[k] as number | null | undefined) ?? ""}
        onChange={(e) => set(k, num(e.target.value) as never)} className={input} /></label>);
  const selField = (k: keyof ProfileData, opts: string[], group?: string) => (
    <label key={k} className="block font-bold">{tf(k)}
      <select value={(d[k] as string | null | undefined) ?? ""} onChange={(e) => set(k, (e.target.value || null) as never)} className={input}>
        <option value="">—</option>
        {opts.map((o) => <option key={o} value={o}>{group ? to(`${group}.${o}`) : o}</option>)}
      </select></label>);
  const txtField = (k: keyof ProfileData) => (
    <label key={k} className="block font-bold">{tf(k)}
      <input value={(d[k] as string | null | undefined) ?? ""} onChange={(e) => set(k, e.target.value as never)} className={input} /></label>);
  const listField = (k: "preferredCountries" | "fields") => (
    <label key={k} className="block font-bold">{tf(k)}
      <input defaultValue={(d[k] ?? []).join(", ")}
        onBlur={(e) => set(k, e.target.value.split(/[,،]/).map((s) => s.trim()).filter(Boolean))} className={input} /></label>);
  const boolField = (k: "volunteering" | "leadership") => (
    <ChipBox key={k} label={tf(k)} checked={!!d[k]} onChange={(v) => set(k, v)} />);

  const panels: Record<(typeof STEPS)[number], React.ReactNode> = {
    personal: <>{selField("targetLevel", C.TARGET_LEVELS, "targetLevels")}{numField("age")}{selField("domicile", C.PROVINCES, "provinces")}{txtField("district")}
      <fieldset className="space-y-2"><legend className="mb-2 font-bold">{tf("categories")}</legend>
        {C.CATEGORIES.map((cat) => (
          <ChipBox key={cat} label={to(`categories.${cat}`)} checked={!!d.categories?.includes(cat)}
            onChange={(v) => set("categories", v ? [...(d.categories ?? []), cat] : (d.categories ?? []).filter((x) => x !== cat))} />))}
      </fieldset></>,
    school: <>
      {selField("board", C.BOARDS)}
      {d.board === "Cambridge" ? (
        <>
          <fieldset className="space-y-3"><legend className="font-bold">Cambridge level</legend>
            {["O-Levels", "A-Levels"].map((level) => (
              <label key={level} className="flex items-center gap-2 font-normal">
                <input type="radio" name="cambridgeLevel" value={level} checked={d.cambridgeLevel === level}
                  onChange={(e) => set("cambridgeLevel", e.target.value)} />
                {level}
              </label>
            ))}
          </fieldset>
          {d.cambridgeLevel && (
            <>
              <fieldset className="space-y-3">
                <div className="flex items-baseline justify-between gap-4">
                  <legend className="font-bold">{t("enterSubjects")}</legend>
                  <span className="text-sm text-muted">
                    {Object.keys(d.cambridgeSubjects || {}).length} / {d.cambridgeLevel === "O-Levels" ? "8" : "3"}
                  </span>
                </div>

                {/* Subject Dropdown */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Select subjects</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const maxSubjects = d.cambridgeLevel === "O-Levels" ? 8 : 3;
                        if (Object.keys(d.cambridgeSubjects || {}).length < maxSubjects) {
                          set("cambridgeSubjects", { ...d.cambridgeSubjects, [e.target.value]: null });
                          e.target.value = "";
                        }
                      }
                    }}
                    className={input}
                    defaultValue="">
                    <option value="">+ {t("addSubject")}</option>
                    {C.CAMBRIDGE_SUBJECTS.map((s) => (
                      <option key={s} value={s} disabled={!!d.cambridgeSubjects?.[s]}>
                        {s.charAt(0).toUpperCase() + s.slice(1).replace(/([A-Z])/g, ' $1')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Subjects */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {Object.entries(d.cambridgeSubjects || {}).map(([subject, grade]) => (
                    <div key={subject} className="flex gap-2 items-center bg-card p-3 rounded-lg border border-line">
                      <span className="flex-1 text-sm font-medium">
                        {subject.charAt(0).toUpperCase() + subject.slice(1).replace(/([A-Z])/g, ' $1')}
                      </span>
                      <select value={grade ?? ""}
                        onChange={(e) => { const u = {...d.cambridgeSubjects}; u[subject] = e.target.value || null; set("cambridgeSubjects", u); }}
                        className="text-sm px-2 py-1 rounded border border-line bg-white">
                        <option value="">Grade</option>
                        {C.GRADES?.map((g) => <option key={g} value={g}>{g.toUpperCase()}</option>)}
                      </select>
                      <button type="button" onClick={() => { const u = {...d.cambridgeSubjects}; delete u[subject]; set("cambridgeSubjects", u); }}
                        className="text-red-600 hover:bg-red-50 px-2 py-1 rounded font-bold">×</button>
                    </div>
                  ))}
                </div>

                {Object.keys(d.cambridgeSubjects || {}).length > 0 && (
                  <p className="text-xs text-muted text-right">
                    {d.cambridgeLevel === "O-Levels" ? "Maximum 8 subjects" : "Maximum 3 subjects"}
                  </p>
                )}
              </fieldset>

              {/* IBCC Equivalence Field */}
              <fieldset className="space-y-2 border-t border-dashed border-line pt-4">
                <legend className="font-bold">{t("ibccEquivalence")}</legend>
                <label className="block text-sm text-muted">{t("ibccEquivalenceHint")}</label>
                <input
                  type="text"
                  placeholder={t("ibccEquivalencePlaceholder")}
                  value={d.ibccEquivalence ?? ""}
                  onChange={(e) => set("ibccEquivalence", e.target.value || null)}
                  className={input}
                />
              </fieldset>
            </>
          )}
        </>
      ) : (
        <>{numField("matricPercent", "0.01", 100)}{numField("interPercent", "0.01", 100)}{selField("interStream", C.STREAMS, "streams")}</>
      )}
    </>,
    university: <>{selField("level", C.LEVELS, "levels")}{txtField("degree")}{numField("yearsOfEducation")}{numField("cgpa", "0.01", 4)}
      {selField("universityType", C.UNIVERSITY_TYPES, "universityTypes")}{txtField("enrolledUniversity")}</>,
    tests: <div className="grid gap-4 sm:grid-cols-3">{C.TESTS.map((k) => (
      <label key={k} className="block font-bold">{k.toUpperCase()}
        <input type="number" inputMode="decimal" step="0.5" min={0} max={TEST_BOUNDS[k] ?? 1000} value={d.tests?.[k] ?? ""}
          onChange={(e) => set("tests", { ...d.tests, [k]: num(e.target.value) })} className={input} /></label>))}</div>,
    finances: numField("monthlyIncome"),
    experience: <>{numField("workYears", "0.5")}{boolField("volunteering")}{boolField("leadership")}</>,
    documents: <div className="grid gap-2 sm:grid-cols-2">{C.DOCUMENTS.map((k) => (
      <ChipBox key={k} label={td(k)} checked={!!d.documents?.[k]} onChange={(v) => set("documents", { ...d.documents, [k]: v })} />))}</div>,
    preferences: <>{selField("studyIn", C.STUDY_IN, "studyIn")}{listField("preferredCountries")}{listField("fields")}</>,
  };

  function describe(err: unknown): string {
    const data = err instanceof ApiError ? (err.data as { data?: Record<string, unknown> } | null) : null;
    if (!data?.data || typeof data.data !== "object") return c("error");
    return Object.entries(data.data).map(([k, v]) => `${tf.has(k) ? tf(k) : k}: ${JSON.stringify(v).replace(/[[\]{}"]/g, " ").trim()}`).join(" · ");
  }
  async function save() {
    setError(null); setBusy(true);
    try {
      await api("profile", { method: "PUT", body: JSON.stringify({ data: d }) });
      await refresh();
      router.push("/results");
    } catch (e) { setError(describe(e)); } finally { setBusy(false); }
  }
  if (loaded === "error") return <ErrorNote>{c("error")}</ErrorNote>;
  if (!loaded) return <Loading label={c("loading")} />;
  const name = STEPS[step];
  const started = STEPS.filter((st) => STEP_FIELDS[st].some((k) => filled(d[k]))).length;
  const Icon = STEP_ICON[name];
  return (
    <div>
      <PageTitle title={t("title")} lead={t("lead")} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[15rem_1fr]">
        <nav aria-label={t("title")} className="min-w-0">
          <p className="mb-2 text-sm font-bold text-muted">{t("progress", { done: started, total: STEPS.length })}</p>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-line lg:hidden"><div className="h-full rounded-full bg-saffron transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
          <ol className="relative flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible">
            <span aria-hidden="true" className="absolute bottom-4 start-[19px] top-4 hidden border-s-2 border-dashed border-line lg:block" />
            {STEPS.map((s, i) => {
              const SIcon = STEP_ICON[s];
              const done = STEP_FIELDS[s].some((k) => filled(d[k]));
              return (
                <li key={s} className="shrink-0">
                  <button type="button" onClick={() => setStep(i)} aria-current={i === step ? "step" : undefined}
                    className={`relative flex items-center gap-2.5 rounded-full py-1.5 pe-4 ps-1.5 text-sm font-bold transition ${i === step ? "bg-indigo text-white" : "bg-card text-ink hover:bg-indigo-soft lg:bg-transparent"}`}>
                    <span className={`grid h-7 w-7 place-items-center rounded-full ${i === step ? "bg-white/15" : done ? "bg-leaf-soft text-leaf" : "bg-paper text-muted"}`}>
                      {done && i !== step ? <Check className="h-4 w-4" /> : <SIcon className="h-4 w-4" />}
                    </span>
                    {t(`steps.${s}`)}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <section className={`${card} min-w-0 p-5 sm:p-7`}>
          <div key={name} className="rise">
            <p className="text-sm font-bold text-muted">{t("stepOf", { n: step + 1, total: STEPS.length })}</p>
            <h2 className="mt-1 flex items-center gap-2.5 font-display text-2xl font-bold text-indigo"><Icon className="h-6 w-6 text-rani" />{t(`steps.${name}`)}</h2>
            <p className="mt-1 text-muted">{t(`hints.${name}`)}</p>
            <div className="mt-6 space-y-5">{panels[name]}</div>
          </div>
          {error && <div className="mt-5"><ErrorNote>{error}</ErrorNote></div>}
          <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-dashed border-line pt-5">
            {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className={btn.ghost}><ArrowLeft className="h-4 w-4 rtl:rotate-180" />{t("back")}</button>}
            {step < STEPS.length - 1 && <button type="button" onClick={() => setStep(step + 1)} className={btn.ghost}>{t("next")}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></button>}
            <button type="button" disabled={busy} onClick={save} className={`${btn.primary} ms-auto`}>{t("save")}</button>
          </div>
        </section>
      </div>
    </div>
  );
}
