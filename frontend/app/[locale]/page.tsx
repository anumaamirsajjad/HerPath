import { BadgeCheck, BookOpen, CircleCheck, CloudOff, Gift, GraduationCap, Hourglass, MessageCircle, Scale, TriangleAlert, Users, XCircle } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Bagh, Hem, StitchedPath } from "@/components/art";
import { btn, card } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { getJSON } from "@/lib/server";
import type { ScholarshipRow } from "@/lib/types";

export const dynamic = "force-dynamic";

async function numbers(locale: string) {
  try {
    const rows = (await getJSON<ScholarshipRow[]>("scholarships", locale)) ?? [];
    return { total: rows.length, pk: rows.filter((r) => r.location === "pakistan").length,
      abroad: rows.filter((r) => r.location === "abroad").length, full: rows.filter((r) => r.funding === "full").length };
  } catch { return null; } // the landing page still works if the API is down
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const n = await numbers(locale);
  const steps = t.raw("steps") as string[];
  const stepColor = ["bg-rani", "bg-saffron", "bg-leaf", "bg-indigo"];
  const example: [typeof CircleCheck, string, string, string?][] = [
    [CircleCheck, "text-leaf", t("example.r1")],
    [CircleCheck, "text-leaf", t("example.r2")],
    [TriangleAlert, "text-[#b77900]", t("example.r3"), t("example.f3")],
    [TriangleAlert, "text-[#b77900]", t("example.r4"), t("example.f4")],
    [CircleCheck, "text-leaf", t("example.r5")],
  ];
  const legend: [typeof CircleCheck, string, string][] = [
    [CircleCheck, "text-leaf bg-leaf-soft", t("legend.met")],
    [TriangleAlert, "text-[#8a5a00] bg-saffron-soft", t("legend.fixable")],
    [Hourglass, "text-sky bg-sky-soft", t("legend.later")],
    [XCircle, "text-muted bg-[#eceaf2]", t("legend.no")],
  ];

  return (
    <div className="space-y-20">
      {/* Hero: the one orchestrated moment on the site. */}
      <section className="pt-4">
        <h1 className="font-display text-[2.6rem] font-bold leading-[1.05] tracking-tight text-indigo sm:text-6xl">
          <span className="block">{t("line1")}</span>
          <span className="block text-rani">{t("line2")}</span>
          <span className="block">{t("line3")}</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted">{t("subtitle")}</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link href="/signup" className={btn.primary}>{t("start")}</Link>
          <Link href="/scholarships" className={btn.ghost}>{t("browse")}</Link>
        </div>
        <div className="mt-10">
          <StitchedPath rtl={locale === "ur"} className="w-full max-w-4xl" />
          <ol className="-mt-2 grid gap-3 sm:grid-cols-4">
            {steps.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-bold text-white ${stepColor[i]}`}>{i + 1}</span>
                <span className="pt-1 font-bold leading-snug">{s}</span>
              </li>
            ))}
          </ol>
        </div>
        {n && n.total > 0 && (
          <p className="mt-10 rounded-2xl bg-indigo px-5 py-4 text-lg text-white">
            {t("numbers", { total: n.total, pk: n.pk, abroad: n.abroad, full: n.full })}
          </p>
        )}
      </section>

      {/* Worked example of the gap analysis, the heart of the product. */}
      <section className="grid items-start gap-8 md:grid-cols-[1fr_1.1fr]">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-indigo">{t("exampleTitle")}</h2>
          <p className="mt-3 text-muted">{t("exampleLead")}</p>
          <h3 className="mt-8 font-bold">{t("legendTitle")}</h3>
          <ul className="mt-3 space-y-2.5">
            {legend.map(([Icon, tone, text]) => (
              <li key={text} className="flex items-center gap-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${tone}`}><Icon className="h-5 w-5" /></span>{text}
              </li>
            ))}
          </ul>
        </div>
        <div className={`${card} overflow-hidden shadow-[var(--shadow-lift)]`} aria-label={t("example.name")}>
          <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo px-5 py-4 text-white">
            <div className="flex items-center gap-3"><GraduationCap className="h-6 w-6 text-saffron" /><p className="font-display text-lg font-bold">{t("example.name")}</p></div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold">{t("example.met")}</span>
          </div>
          <ul className="relative space-y-4 px-5 py-5">
            <span className="stitch absolute bottom-8 start-[31px] top-8 w-0 border-s-2 border-dashed border-line" aria-hidden="true" />
            {example.map(([Icon, tone, text, fix], i) => (
              <li key={i} className="relative flex gap-3">
                <Icon className={`relative h-6 w-6 shrink-0 rounded-full bg-card ${tone}`} />
                <div>
                  <p className={fix ? "font-bold" : ""}>{text}</p>
                  {fix && <p className="mt-1 rounded-lg bg-saffron-soft px-3 py-2 text-sm">{fix}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Families and teachers: the people who decide and the people who guide. */}
      <section className="grid gap-5 md:grid-cols-2">
        <div className={`${card} relative overflow-hidden p-6`}>
          <Bagh className="absolute -end-4 -top-4 h-24 w-24 opacity-90" />
          <Users className="h-8 w-8 text-rani" />
          <h2 className="mt-3 font-display text-2xl font-bold text-indigo">{t("familyTitle")}</h2>
          <p className="mt-2 text-muted">{t("familyText")}</p>
          <Link href="/family/peef-undergraduate" locale="ur" className={`${btn.link} mt-4 inline-flex items-center gap-2`}>
            <MessageCircle className="h-4 w-4" />{t("familyCta")}
          </Link>
        </div>
        <div className={`${card} relative overflow-hidden p-6`}>
          <Bagh className="absolute -end-4 -top-4 h-24 w-24 opacity-90" petal="#1e8a5b" heart="#1f2a6b" />
          <BookOpen className="h-8 w-8 text-leaf" />
          <h2 className="mt-3 font-display text-2xl font-bold text-indigo">{t("teacherTitle")}</h2>
          <p className="mt-2 text-muted">{t("teacherText")}</p>
          <Link href="/guides" className={`${btn.link} mt-4 inline-block`}>{t("teacherCta")}</Link>
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl font-bold tracking-tight text-indigo">{t("promiseTitle")}</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {([[Gift, "free"], [Scale, "rules"], [CloudOff, "docs"], [BadgeCheck, "verified"]] as const).map(([Icon, k]) => (
            <li key={k} className="flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-saffron-soft text-[#8a5a00]"><Icon className="h-5 w-5" /></span>
              <p className="pt-2">{t(`promise.${k}`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="overflow-hidden rounded-[2rem] bg-indigo text-white">
        <Hem className="h-3 w-full" />
        <div className="flex flex-col items-start gap-5 px-6 py-10 sm:px-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight">{t("finalTitle")}</h2>
            <p className="mt-2 max-w-xl text-white/80">{t("finalText")}</p>
          </div>
          <Link href="/signup" className={btn.accent}>{t("start")}</Link>
        </div>
      </section>
    </div>
  );
}
