import { ArrowLeft, BadgeCheck, CalendarDays, FileText, Layers, MapPin, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DetailActions, GapSection } from "@/components/DetailActions";
import { COVER_ICON, type Cover } from "@/components/icons";
import ReportProblem from "@/components/ReportProblem";
import { card } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { formatDate } from "@/lib/dates";
import { getJSON } from "@/lib/server";
import type { ScholarshipDetail } from "@/lib/types";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = await getJSON<ScholarshipDetail>(`scholarships/${slug}`, locale);
  if (!s) return {};
  return { title: `${s.name} | HerPath`, description: s.summary,
    openGraph: { title: s.name, description: s.summary, siteName: "HerPath", locale: locale === "ur" ? "ur_PK" : "en_PK" } };
}

/** "1. Do this.\n2. Then this." → ["Do this.", "Then this."]; plain text stays one paragraph. */
function steps(text: string): string[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.every((l) => /^[\d۰-۹]+[.)]/.test(l)) ? lines.map((l) => l.replace(/^[\d۰-۹]+[.)]\s*/, "")) : [];
}

function Section({ icon: Icon, title, children }: { icon: typeof MapPin; title: string; children: React.ReactNode }) {
  return (
    <section className={`${card} p-5 sm:p-6`}>
      <h2 className="mb-3 flex items-center gap-2.5 font-display text-xl font-bold text-indigo"><Icon className="h-5 w-5 text-rani" />{title}</h2>
      {children}
    </section>
  );
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const s = await getJSON<ScholarshipDetail>(`scholarships/${slug}`, locale);
  if (!s) notFound();
  const t = await getTranslations("scholarship");
  const tDocs = await getTranslations("documents");
  const tc = await getTranslations("countries");
  const tf = await getTranslations("filters");
  const months = (await getTranslations("common")).raw("months") as string[];
  const when = s.deadline ? `${t("deadline")}: ${formatDate(s.deadline, locale)}`
    : s.usual_opening_month ? t("usuallyOpens", { month: months[s.usual_opening_month - 1] }) : t(s.status);
  const applySteps = steps(s.application_steps);
  const facts: [typeof MapPin, string, React.ReactNode][] = [
    [Wallet, t("funding"), tf(s.funding)],
    [CalendarDays, t("when"), <>{when}<span className="block text-xs font-normal opacity-80">{t("status")}: {t(s.status)}</span></>],
    [Layers, t("levels"), s.levels.map((l) => tf(l)).join(", ")],
    [BadgeCheck, t("combine"), s.allows_other_scholarship ? t("combineYes") : t("combineNo")],
  ];

  return (
    <article className="space-y-6">
      <Link href="/scholarships" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-indigo">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />{t("back")}
      </Link>

      <header className="relative overflow-hidden rounded-[1.75rem] bg-indigo p-6 text-white sm:p-8">
        <p className="flex items-center gap-1.5 text-sm text-white/80"><MapPin className="h-4 w-4" />{tc.has(s.country) ? tc(s.country) : s.country}</p>
        <h1 className="mt-2 max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{s.name}</h1>
        <p className="mt-2 text-white/80" dir="auto">{s.provider}</p>
        <p className="mt-4 max-w-2xl text-lg">{s.summary}</p>
        <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {facts.map(([Icon, label, value]) => (
            <div key={label} className="rounded-2xl bg-white/10 p-3.5">
              <dt className="flex items-center gap-1.5 text-xs text-white/75"><Icon className="h-4 w-4 text-saffron" />{label}</dt>
              <dd className="mt-1 font-bold leading-snug">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-xs text-white/70">{t("verified", { date: formatDate(s.last_verified, locale) })}</p>
      </header>

      <DetailActions slug={slug} shareText={`${s.name} (${s.provider})\n${s.summary}`} officialLink={s.official_link} />

      <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
        <section className={`${card} p-5 sm:p-6`}>
          <h2 className="mb-4 font-display text-2xl font-bold text-indigo">{t("gapTitle")}</h2>
          <GapSection slug={slug} />
        </section>
        <div className="space-y-6">

        <Section icon={Wallet} title={t("covers")}>
          <ul className="mb-3 flex flex-wrap gap-2">
            {s.covers.map((cv) => {
              const Icon = COVER_ICON[cv as Cover];
              return <li key={cv} className="inline-flex items-center gap-1.5 rounded-full bg-saffron-soft px-3 py-1.5 text-sm font-bold text-[#6b4600]">{Icon && <Icon className="h-4 w-4" />}{tf(cv)}</li>;
            })}
          </ul>
          <p className="whitespace-pre-line">{s.coverage}</p>
        </Section>

        <Section icon={Layers} title={t("whoFor")}><p className="whitespace-pre-line">{s.who_for}</p></Section>

        <Section icon={FileText} title={t("documents")}>
          <ul className="grid gap-2 sm:grid-cols-2">
            {s.required_documents.map((d) => <li key={d} className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2"><FileText className="h-4 w-4 text-indigo" />{tDocs(d)}</li>)}
          </ul>
        </Section>
        </div>
      </div>

      <Section icon={CalendarDays} title={t("steps")}>
        {applySteps.length ? (
          <ol className="space-y-3">
            {applySteps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo font-bold text-white">{i + 1}</span>
                <p className="pt-1">{step}</p>
              </li>
            ))}
          </ol>
        ) : <p className="whitespace-pre-line">{s.application_steps}</p>}
      </Section>

      <ReportProblem slug={slug} />
    </article>
  );
}
