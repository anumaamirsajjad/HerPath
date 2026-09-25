"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import GapAnalysis from "@/components/GapAnalysis";
import WhatsAppShare from "@/components/WhatsAppShare";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { SavedList } from "@/lib/types";

export function DetailActions({ slug, shareText, officialLink }: { slug: string; shareText: string; officialLink: string }) {
  const t = useTranslations("scholarship");
  const c = useTranslations("common");
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  useEffect(() => {
    if (user) api<SavedList>("saved").then((r) => setSaved(r.items.some((i) => i.slug === slug))).catch(() => {});
  }, [user, slug]);
  async function toggleSave() {
    setSaveError(false);
    try {
      if (saved) await api(`saved/${slug}`, { method: "DELETE" });
      else await api("saved", { method: "POST", body: JSON.stringify({ slug }) });
      setSaved(!saved);
    } catch { setSaveError(true); }
  }
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {user && <button onClick={toggleSave} className="rounded border px-3 py-2">{saved ? t("saved") : t("save")}</button>}
        <WhatsAppShare text={shareText} label={t("share")} />
        <Link href={`/family/${slug}`} locale="ur" className="rounded border px-3 py-2">{t("family")}</Link>
        <a href={officialLink} target="_blank" rel="noopener" className="rounded border px-3 py-2">{t("official")}</a>
      </div>
      {saveError && <p role="alert" className="text-red-700">{c("error")}</p>}
    </>
  );
}

export function GapSection({ slug }: { slug: string }) {
  const t = useTranslations("scholarship");
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <GapAnalysis slug={slug} /> : <p className="text-sm"><Link href="/login" className="underline">{t("loginToCheck")}</Link></p>;
}
