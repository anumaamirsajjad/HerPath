"use client";
import { useTranslations } from "next-intl";
import { emptyFilters, type FilterState } from "@/lib/filters";

type ListKey = "levels" | "types" | "funding" | "covers" | "test" | "women";
const GROUPS: [ListKey, string, string[]][] = [
  ["levels", "level", ["undergraduate", "masters", "phd"]],
  ["types", "type", ["need", "merit"]],
  ["funding", "funding", ["full", "partial", "tuition_only", "stipend_only"]],
  ["covers", "covers", ["tuition", "stipend", "hostel", "airfare", "insurance", "books"]],
  ["test", "test", ["required", "waiver_possible", "none"]],
  ["women", "women", ["women_only", "female_quota"]],
];

export default function Filters({ value, onChange, loggedIn }: { value: FilterState; onChange: (f: FilterState) => void; loggedIn: boolean }) {
  const t = useTranslations("filters");
  const toggle = (k: ListKey, v: string) =>
    onChange({ ...value, [k]: value[k].includes(v) ? value[k].filter((x) => x !== v) : [...value[k], v] });
  return (
    <details className="rounded border p-3">
      <summary className="cursor-pointer font-semibold">{t("title")}</summary>
      <div className="mt-3 space-y-3 text-sm">
        <fieldset className="flex flex-wrap gap-3"><legend className="font-medium">{t("where")}</legend>
          {(["", "pakistan", "abroad"] as const).map((w) => (
            <label key={w}><input type="radio" name="where" checked={value.where === w} onChange={() => onChange({ ...value, where: w })} /> {t(w || "both")}</label>))}
        </fieldset>
        {GROUPS.map(([k, label, opts]) => (
          <fieldset key={k} className="flex flex-wrap gap-3"><legend className="font-medium">{t(label)}</legend>
            {opts.map((o) => <label key={o}><input type="checkbox" checked={value[k].includes(o)} onChange={() => toggle(k, o)} /> {t(o)}</label>)}
          </fieldset>))}
        <fieldset className="flex flex-wrap gap-3"><legend className="font-medium">{t("deadline")}</legend>
          {(["", "thisMonth", "threeMonths"] as const).map((d) => (
            <label key={d}><input type="radio" name="deadline" checked={value.deadline === d} onChange={() => onChange({ ...value, deadline: d })} /> {t(d || "anyDeadline")}</label>))}
        </fieldset>
        {loggedIn && <div className="flex flex-wrap gap-3">
          {(["myProvince", "myIncome", "myCategories"] as const).map((k) => (
            <label key={k}><input type="checkbox" checked={value[k]} onChange={(e) => onChange({ ...value, [k]: e.target.checked })} /> {t(k)}</label>))}
        </div>}
        <button type="button" onClick={() => onChange(emptyFilters)} className="underline">{t("clear")}</button>
      </div>
    </details>
  );
}
