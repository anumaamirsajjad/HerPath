"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { api, ApiError } from "@/lib/api";
import type { Guide } from "@/lib/types";

export default function Page() {
  const { slug } = useParams<{ slug: string }>();
  const lang = useLocale();
  const t = useTranslations("scholarship");
  const c = useTranslations("common");
  const [g, setG] = useState<Guide | null | "missing" | "error">(null);
  useEffect(() => {
    api<Guide>(`guides/${slug}`, { lang }).then(setG).catch((e) => setG(e instanceof ApiError && e.status === 404 ? "missing" : "error"));
  }, [slug, lang]);
  if (g === "missing") return <p>{t("guideSoon")}</p>;
  if (g === "error") return <p role="alert">{c("error")}</p>;
  if (!g) return <p>{c("loading")}</p>;
  // Guide bodies are Markdown written by admins and rendered server-side, so they are trusted HTML.
  return <article><h1 className="text-2xl font-bold">{g.title}</h1><div dangerouslySetInnerHTML={{ __html: g.body }} /></article>;
}
