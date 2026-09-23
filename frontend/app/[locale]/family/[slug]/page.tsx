"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import WhatsAppShare from "@/components/WhatsAppShare";
import { Link } from "@/i18n/routing";
import { api, ApiError } from "@/lib/api";
import type { ScholarshipDetail } from "@/lib/types";

export default function Page() {
  const { slug } = useParams<{ slug: string }>();
  const lang = useLocale();
  const t = useTranslations("family");
  const ts = useTranslations("scholarship");
  const tf = useTranslations("filters");
  const c = useTranslations("common");
  const [s, setS] = useState<ScholarshipDetail | null | "missing" | "error">(null);
  useEffect(() => {
    api<ScholarshipDetail>(`scholarships/${slug}`, { lang }).then(setS)
      .catch((e) => setS(e instanceof ApiError && e.status === 404 ? "missing" : "error"));
  }, [slug, lang]);
  if (s === "missing") return <p>404</p>;
  if (s === "error") return <p role="alert">{c("error")}</p>;
  if (!s) return <p>{c("loading")}</p>;
  return (
    <article className="space-y-4 text-lg leading-relaxed">
      {lang !== "ur" && <p className="text-sm"><Link href={`/family/${slug}`} locale="ur" className="underline">{t("readUrdu")}</Link></p>}
      <h1 className="text-2xl font-bold">{t("title")}: {s.name}</h1>
      <p>{t("free", { provider: s.provider })}</p>
      <p className="whitespace-pre-line">{s.family_summary}</p>
      <section>
        <h2>{t("covers")}</h2>
        <p className="whitespace-pre-line">{s.coverage}</p>
        <p className="text-sm">{s.covers.map((x) => tf(x)).join(" · ")}</p>
      </section>
      <section>
        <h2>{t("where")}</h2>
        <p>{s.country}{s.covers.includes("hostel") ? ` · ${tf("hostel")}` : ""}</p>
      </section>
      <p className="text-sm text-gray-600">
        {ts("verified", { date: s.last_verified })} · <a href={s.official_link} className="underline" target="_blank" rel="noopener">{ts("official")}</a>
      </p>
      <WhatsAppShare text={`${s.name}\n${s.family_summary}`} label={t("share")}
        onShare={() => { api("counters/family_shared", { method: "POST" }).catch(() => {}); }} />
    </article>
  );
}
