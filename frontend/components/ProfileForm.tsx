"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import * as C from "@/lib/choices";
import type { Profile, ProfileData } from "@/lib/types";

const STEPS = ["personal", "school", "university", "tests", "finances", "experience", "documents", "preferences"] as const;
const EMPTY: ProfileData = { categories: [], tests: {}, documents: {}, preferredCountries: [], fields: [] };
const num = (v: string) => (v === "" ? null : Number(v));
const input = "mt-1 w-full rounded border p-2";

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
    <label key={k} className="block">{tf(k)}
      <input type="number" inputMode="decimal" step={step} min={0} max={max} value={(d[k] as number | null | undefined) ?? ""}
        onChange={(e) => set(k, num(e.target.value) as never)} className={input} /></label>);
  const selField = (k: keyof ProfileData, opts: string[], group?: string) => (
    <label key={k} className="block">{tf(k)}
      <select value={(d[k] as string | null | undefined) ?? ""} onChange={(e) => set(k, (e.target.value || null) as never)} className={input}>
        <option value="">—</option>
        {opts.map((o) => <option key={o} value={o}>{group ? to(`${group}.${o}`) : o}</option>)}
      </select></label>);
  const txtField = (k: keyof ProfileData) => (
    <label key={k} className="block">{tf(k)}
      <input value={(d[k] as string | null | undefined) ?? ""} onChange={(e) => set(k, e.target.value as never)} className={input} /></label>);
  const listField = (k: "preferredCountries" | "fields") => (
    <label key={k} className="block">{tf(k)}
      <input defaultValue={(d[k] ?? []).join(", ")}
        onBlur={(e) => set(k, e.target.value.split(/[,،]/).map((s) => s.trim()).filter(Boolean))} className={input} /></label>);
  const boolField = (k: "volunteering" | "leadership") => (
    <label key={k} className="flex gap-2"><input type="checkbox" checked={!!d[k]} onChange={(e) => set(k, e.target.checked)} />{tf(k)}</label>);

  const panels: Record<(typeof STEPS)[number], React.ReactNode> = {
    personal: <>{selField("targetLevel", C.TARGET_LEVELS, "targetLevels")}{numField("age")}{selField("domicile", C.PROVINCES, "provinces")}{txtField("district")}
      <fieldset><legend>{tf("categories")}</legend>
        {C.CATEGORIES.map((cat) => (
          <label key={cat} className="flex gap-2"><input type="checkbox" checked={!!d.categories?.includes(cat)}
            onChange={(e) => set("categories", e.target.checked ? [...(d.categories ?? []), cat] : (d.categories ?? []).filter((x) => x !== cat))} />
            {to(`categories.${cat}`)}</label>))}
      </fieldset></>,
    school: <>{selField("board", C.BOARDS)}{numField("matricPercent", "0.01", 100)}{numField("interPercent", "0.01", 100)}{selField("interStream", C.STREAMS, "streams")}</>,
    university: <>{selField("level", C.LEVELS, "levels")}{txtField("degree")}{numField("yearsOfEducation")}{numField("cgpa", "0.01", 4)}
      {selField("universityType", C.UNIVERSITY_TYPES, "universityTypes")}{txtField("enrolledUniversity")}</>,
    tests: <>{C.TESTS.map((k) => (
      <label key={k} className="block">{k.toUpperCase()}
        <input type="number" inputMode="decimal" step="0.5" min={0} value={d.tests?.[k] ?? ""}
          onChange={(e) => set("tests", { ...d.tests, [k]: num(e.target.value) })} className={input} /></label>))}</>,
    finances: numField("monthlyIncome"),
    experience: <>{numField("workYears", "0.5")}{boolField("volunteering")}{boolField("leadership")}</>,
    documents: <>{C.DOCUMENTS.map((k) => (
      <label key={k} className="flex gap-2"><input type="checkbox" checked={!!d.documents?.[k]}
        onChange={(e) => set("documents", { ...d.documents, [k]: e.target.checked })} />{td(k)}</label>))}</>,
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
  if (loaded === "error") return <p role="alert">{c("error")}</p>;
  if (!loaded) return <p>{c("loading")}</p>;
  const name = STEPS[step];
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("title")}</h1>
      <ol className="flex flex-wrap gap-2 text-sm">
        {STEPS.map((s, i) => (
          <li key={s}><button type="button" onClick={() => setStep(i)} aria-current={i === step ? "step" : undefined}
            className={`rounded-full px-2 py-0.5 ${i === step ? "bg-emerald-700 text-white" : "border"}`}>{t(`steps.${s}`)}</button></li>))}
      </ol>
      <div className="space-y-3">{panels[name]}</div>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <div className="flex gap-2">
        {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="rounded border px-3 py-2">{t("back")}</button>}
        {step < STEPS.length - 1 && <button type="button" onClick={() => setStep(step + 1)} className="rounded border px-3 py-2">{t("next")}</button>}
        <button type="button" disabled={busy} onClick={save} className="ms-auto rounded bg-emerald-700 px-3 py-2 text-white disabled:opacity-60">{t("save")}</button>
      </div>
    </div>
  );
}
