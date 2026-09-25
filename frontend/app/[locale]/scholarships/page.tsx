import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ScholarshipBrowser from "@/components/ScholarshipBrowser";
import { PageTitle } from "@/components/ui";
import { getJSON } from "@/lib/server";
import type { ScholarshipRow } from "@/lib/types";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: `${t("scholarships")} | HerPath` };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const rows = (await getJSON<ScholarshipRow[]>("scholarships", locale)) ?? [];
  const t = await getTranslations("list");
  return (
    <>
      <PageTitle title={t("title")} lead={t("lead")} />
      <ScholarshipBrowser initialRows={rows} />
    </>
  );
}
