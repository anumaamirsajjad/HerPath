"use client";
import { Bookmark, BookmarkCheck, ExternalLink, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import GapAnalysis from "@/components/GapAnalysis";
import WhatsAppShare from "@/components/WhatsAppShare";
import { ErrorNote, btn, card } from "@/components/ui";
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
        {user && (
          <button onClick={toggleSave} aria-pressed={saved} className={saved ? `${btn.accent} pop` : btn.ghost}>
            {saved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}{saved ? t("saved") : t("save")}
          </button>
        )}
        <WhatsAppShare text={shareText} label={t("share")} />
        <Link href={`/family/${slug}`} locale="ur" className={btn.ghost}><Users className="h-5 w-5" />{t("family")}</Link>
        <a href={officialLink} target="_blank" rel="noopener" className={btn.ghost}><ExternalLink className="h-5 w-5" />{t("official")}</a>
      </div>
      {saveError && <div className="mt-3"><ErrorNote>{c("error")}</ErrorNote></div>}
    </>
  );
}

export function GapSection({ slug }: { slug: string }) {
  const t = useTranslations("scholarship");
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <GapAnalysis slug={slug} /> : (
    <div className={`${card} flex flex-col items-start gap-3 bg-indigo-soft p-5`}>
      <p className="font-bold text-indigo">{t("loginToCheck")}</p>
      <Link href="/login" className={btn.primary}>{t("loginToCheckCta")}</Link>
    </div>
  );
}
