"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import RequireAuth from "@/components/RequireAuth";
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
  if (p === "none") return <p><Link href="/profile" className="underline">{tabs("noProfile")}</Link></p>;
  if (!p) return <p>{c("loading")}</p>;
  const profile = p;
  async function toggle(key: string, have: boolean) {
    const data = { ...profile.data, documents: { ...profile.data.documents, [key]: have } };
    setP({ ...profile, data }); // optimistic: tick shows immediately on slow connections
    setSaving(key); setError(false);
    try {
      await api("profile", { method: "PUT", body: JSON.stringify({ data }) });
      await load();
    } catch { setP(profile); setError(true); } finally { setSaving(null); }
  }
  // Documents that unlock the most scholarships first, so she knows what to fix first.
  const order = [...DOCUMENTS].sort((a, b) => (unlocks[b] ?? 0) - (unlocks[a] ?? 0));
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">{t("title")}</h1>
      {error && <p role="alert" className="text-red-700">{c("error")}</p>}
      {order.map((k) => {
        const have = !!profile.data.documents?.[k];
        return (
          <div key={k} className="flex items-start gap-3 rounded border p-3">
            <input id={`doc-${k}`} type="checkbox" checked={have} disabled={saving === k} onChange={(e) => toggle(k, e.target.checked)} className="mt-1" />
            <div>
              <label htmlFor={`doc-${k}`} className="font-medium">{td(k)}</label>
              {!have && (unlocks[k] ?? 0) > 0 && <p className="text-sm text-emerald-700">{t("unlocks", { count: unlocks[k] })}</p>}
              {!have && <Link href={`/guides/${GUIDE[k]}`} className="text-xs underline">{ts("guide")}</Link>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default function Page() { return <RequireAuth><Checklist /></RequireAuth>; }
