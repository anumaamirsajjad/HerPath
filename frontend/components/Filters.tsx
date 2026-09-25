"use client";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { emptyFilters, type FilterState } from "@/lib/filters";

type ListKey = "levels" | "types" | "funding" | "covers" | "test" | "women";
const GROUPS: [ListKey, string, string[]][] = [
  ["levels", "level", ["undergraduate", "masters", "phd"]],
  ["funding", "funding", ["full", "partial", "tuition_only", "stipend_only"]],
  ["types", "type", ["need", "merit"]],
  ["covers", "covers", ["tuition", "stipend", "hostel", "airfare", "insurance", "books"]],
  ["test", "test", ["required", "waiver_possible", "none"]],
  ["women", "women", ["women_only", "female_quota"]],
];

/** A chip is a real checkbox or radio (the input covers the chip), so it works with keyboards and screen readers. */
function Chip({ label, checked, onChange, type = "checkbox", name }: { label: string; checked: boolean; onChange: () => void; type?: "checkbox" | "radio"; name?: string }) {
  return (
    <label className={`relative inline-flex cursor-pointer items-center rounded-full border-2 px-3 py-1.5 text-sm font-bold transition has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-saffron ${checked ? "border-indigo bg-indigo text-white" : "border-line bg-card text-ink hover:border-indigo"}`}>
      <input type={type} name={name} checked={checked} onChange={onChange} className="absolute inset-0 cursor-pointer opacity-0" />
      {label}
    </label>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <fieldset className="space-y-2"><legend className="mb-2 text-sm font-bold text-muted">{title}</legend><div className="flex flex-wrap gap-2">{children}</div></fieldset>;
}

export default function Filters({ value, onChange, loggedIn }: { value: FilterState; onChange: (f: FilterState) => void; loggedIn: boolean }) {
  const t = useTranslations("filters");
  const toggle = (k: ListKey, v: string) =>
    onChange({ ...value, [k]: value[k].includes(v) ? value[k].filter((x) => x !== v) : [...value[k], v] });
  return (
    <div className="space-y-5">
      {loggedIn && (
        <Group title={t("forYou")}>
          {(["myProvince", "myIncome", "myCategories"] as const).map((k) => (
            <Chip key={k} label={t(k)} checked={value[k]} onChange={() => onChange({ ...value, [k]: !value[k] })} />))}
        </Group>
      )}
      <Group title={t("where")}>
        {(["", "pakistan", "abroad"] as const).map((w) => (
          <Chip key={w} type="radio" name="where" label={t(w || "both")} checked={value.where === w} onChange={() => onChange({ ...value, where: w })} />))}
      </Group>
      {GROUPS.map(([k, label, opts]) => (
        <Group key={k} title={t(label)}>
          {opts.map((o) => <Chip key={o} label={t(o)} checked={value[k].includes(o)} onChange={() => toggle(k, o)} />)}
        </Group>
      ))}
      <Group title={t("deadline")}>
        {(["", "thisMonth", "threeMonths"] as const).map((d) => (
          <Chip key={d} type="radio" name="deadline" label={t(d || "anyDeadline")} checked={value.deadline === d} onChange={() => onChange({ ...value, deadline: d })} />))}
      </Group>
      <button type="button" onClick={() => onChange({ ...emptyFilters, q: value.q })} className="inline-flex items-center gap-1.5 text-sm font-bold text-rani hover:underline">
        <X className="h-4 w-4" />{t("clear")}
      </button>
    </div>
  );
}
