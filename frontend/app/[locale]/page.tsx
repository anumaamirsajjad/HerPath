import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/i18n/routing";

export default function Home({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(use(params).locale);
  const t = useTranslations("landing");
  return (
    <section className="space-y-6 py-10 text-center">
      <h1 className="text-3xl font-bold leading-tight">{t("title")}</h1>
      <p className="text-lg text-gray-700">{t("subtitle")}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/scholarships" className="rounded border px-4 py-3">{t("browse")}</Link>
        <Link href="/signup" className="rounded bg-emerald-700 px-4 py-3 text-white">{t("start")}</Link>
      </div>
      <p className="text-sm text-gray-500">{t("free")}</p>
    </section>
  );
}
