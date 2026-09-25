import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getJSON } from "@/lib/server";
import type { Guide } from "@/lib/types";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const g = await getJSON<Guide>(`guides/${slug}`, locale);
  return g ? { title: `${g.title} | HerPath`, openGraph: { title: g.title, siteName: "HerPath" } } : {};
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const g = await getJSON<Guide>(`guides/${slug}`, locale);
  if (!g) return <p>{(await getTranslations("scholarship"))("guideSoon")}</p>;
  // Guide bodies are Markdown written by admins and rendered by the API, so they are trusted HTML.
  return <article><h1 className="text-2xl font-bold">{g.title}</h1><div dangerouslySetInnerHTML={{ __html: g.body }} /></article>;
}
