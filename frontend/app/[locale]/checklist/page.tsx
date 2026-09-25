"use client";
import { BookOpen, Check, CreditCard, FileBadge, FileText, Landmark, Languages, Mail, Plane, Sparkles, Stamp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import RequireAuth from "@/components/RequireAuth";
import { Empty, ErrorNote, Loading, PageTitle, ScoreRing, btn, card } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api";
import { DOCUMENTS } from "@/lib/choices";
import type { Profile } from "@/lib/types";

// Documents whose fix-it guide slug differs from the document key.
const GUIDE: Record<string, string> = {
  domicile: "domicile-certificate", incomeCertificate: "income-certificate", hecAttestation: "hec-attestation",
  ibccEquivalence: "ibcc-equivalence", passport: "passport", cnic: "cnic-bform",
  recommendationLetters: "recommendation-letters", englishMediumLetter: "english-medium-letter",
};
const ICON: Record<string, typeof FileText> = {
  cnic: CreditCard, domicile: Landmark, passport: Plane, incomeCertificate: FileText, hecAttestation: Stamp,
  ibccEquivalence: FileBadge, recommendationLetters: Mail, englishMediumLetter: Languages,
};

function Checklist() {
  const t = useTranslations("checklist");
  const td = useTranslations("documents");
  const ts = useTranslations("scholarship");
  const tabs = useTranslations("tabs");
  const c = useTranslations("common");
  const [p, setP] = useState<Profile | null | "none">(null);
  const [unlocks, setUnlocks] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    try {
      const [prof, u] = await Promise.all([api<Profile>("profile"), api<{ unlocks: Record<string, number> }>("match/unlocks")]);
      setP(prof); setUnlocks(u.unlocks);
    } catch { setP("none"); }
  }, []);
  useEffect(() => { load(); }, [load]);
  if (p === "none") return <Empty title={tabs("noProfile")}><Link href="/profile" className={btn.primary}>{tabs("noProfile")}</Link></Empty>;
  if (!p) return <Loading label={c("loading")} />;
  const profile = p;
  async function toggle(key: string, have: boolean) {
    const data = { ...profile.data, documents: { ...profile.data.documents, [key]: have } };
    setP({ ...profile, data }); // optimistic: the tick shows immediately on slow connections
    setSaving(key); setError(false);
    try {
      await api("profile", { method: "PUT", body: JSON.stringify({ data }) });
      await load();
    } catch { setP(profile); setError(true); } finally { setSaving(null); }
  }
  // Documents that unlock the most scholarships first, so she knows what to fix first.
  const has = (k: string) => (profile.data.documents?.[k] ? 1 : 0);
  const order = [...DOCUMENTS].sort((a, b) => has(a) - has(b) || (unlocks[b] ?? 0) - (unlocks[a] ?? 0));
  const have = DOCUMENTS.filter(has).length;
  const best = order.find((k) => !profile.data.documents?.[k] && (unlocks[k] ?? 0) > 0);

  return (
    <div>
      <PageTitle title={t("title")} lead={t("lead")}>
        <div className="flex items-center gap-3 rounded-2xl bg-card px-4 py-2.5 shadow-[var(--shadow-lift)]">
          <ScoreRing score={Math.round((have / DOCUMENTS.length) * 100)} size={48} />
          <p className="font-bold">{t("progress", { have, total: DOCUMENTS.length })}</p>
        </div>
      </PageTitle>
      {error && <div className="mb-4"><ErrorNote>{c("error")}</ErrorNote></div>}
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {order.map((k) => {
          const done = !!profile.data.documents?.[k];
          const Icon = ICON[k] ?? FileText;
          const n = unlocks[k] ?? 0;
          return (
            <li key={k} className={`${card} relative flex gap-4 p-4 transition ${done ? "border-leaf/40 bg-leaf-soft/40" : ""} ${k === best ? "ring-2 ring-saffron" : ""}`}>
              {k === best && <span className="absolute -top-3 start-4 inline-flex items-center gap-1 rounded-full bg-saffron px-2.5 py-0.5 text-xs font-bold text-ink"><Sparkles className="h-3.5 w-3.5" />{t("startHere")}</span>}
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${done ? "bg-leaf text-white" : "bg-indigo-soft text-indigo"}`}>
                {done ? <Check className="pop h-6 w-6" /> : <Icon className="h-6 w-6" />}
              </span>
              <div className="min-w-0 flex-1">
                <label htmlFor={`doc-${k}`} className="block cursor-pointer font-bold">{td(k)}</label>
                {!done && n > 0 && <p className="text-sm font-bold text-[#8a5a00]">{t("unlocks", { count: n })}</p>}
                {!done && <Link href={`/guides/${GUIDE[k]}`} className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-indigo hover:underline"><BookOpen className="h-3.5 w-3.5" />{ts("guide")}</Link>}
              </div>
              <input id={`doc-${k}`} type="checkbox" checked={done} disabled={saving === k} onChange={(e) => toggle(k, e.target.checked)}
                className="mt-1 h-6 w-6 shrink-0 cursor-pointer accent-[#1e8a5b]" aria-describedby={`doc-${k}-hint`} />
              <span id={`doc-${k}-hint`} className="sr-only">{t("have")}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
export default function Page() { return <RequireAuth><Checklist /></RequireAuth>; }
