"use client";
import { BookOpen, FileCheck2, Bookmark, Compass, Sparkles, UserRound, Settings, LogOut } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { LogoMark } from "@/components/art";
import { Link, usePathname } from "@/i18n/routing";
import { useAuth } from "@/lib/auth";

const APP = [
  { href: "/scholarships", key: "scholarships", Icon: Compass },
  { href: "/results", key: "results", Icon: Sparkles },
  { href: "/checklist", key: "checklist", Icon: FileCheck2 },
  { href: "/saved", key: "saved", Icon: Bookmark },
  { href: "/profile", key: "profile", Icon: UserRound },
] as const;

export default function Nav() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const linkCls = (href: string) =>
    `rounded-full px-3 py-2 text-sm font-bold transition ${active(href) ? "bg-indigo-soft text-indigo" : "text-muted hover:text-indigo"}`;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-4">
          <Link href="/" className="me-2 flex items-center gap-2" aria-label="HerPath">
            <LogoMark />
            <span className="font-display text-xl font-bold tracking-tight text-indigo" dir="ltr">HerPath</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label={t("menu")}>
            {(user ? APP : APP.slice(0, 1)).map(({ href, key }) => <Link key={href} href={href} className={linkCls(href)}>{t(key)}</Link>)}
            <Link href="/guides" className={linkCls("/guides")}>{t("guides")}</Link>
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <Link href={pathname} locale={locale === "ur" ? "en" : "ur"} className="rounded-full border-2 border-line px-3 py-1.5 text-sm font-bold text-indigo hover:border-indigo">
              {t("language")}
            </Link>
            {!loading && !user && (
              <>
                <Link href="/login" className="hidden rounded-full px-3 py-2 text-sm font-bold text-indigo sm:inline-flex">{t("login")}</Link>
                <Link href="/signup" className="rounded-full bg-indigo px-4 py-2 text-sm font-bold text-white">{t("signup")}</Link>
              </>
            )}
            {user && (
              <div className="hidden items-center gap-1 md:flex">
                <Link href="/settings" aria-label={t("settings")} className="rounded-full p-2 text-muted hover:text-indigo"><Settings className="h-5 w-5" /></Link>
                <button onClick={logout} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-muted hover:text-rani">
                  <LogOut className="h-4 w-4" />{t("logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {user && (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label={t("menu")}>
          <ul className="grid grid-cols-5">
            {APP.map(({ href, key, Icon }) => (
              <li key={href}>
                <Link href={href} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${active(href) ? "text-indigo" : "text-muted"}`}>
                  <span className={`rounded-full px-3 py-1 transition ${active(href) ? "bg-saffron-soft" : ""}`}><Icon className="h-5 w-5" /></span>
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}

export function Footer() {
  const t = useTranslations("footer");
  const n = useTranslations("nav");
  return (
    <footer className="mt-16 border-t border-line bg-card pb-24 md:pb-0">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:grid-cols-[1.4fr_1fr]">
        <div className="space-y-2">
          <div className="flex items-center gap-2"><LogoMark className="h-7 w-7" /><span className="font-display text-lg font-bold text-indigo" dir="ltr">HerPath</span></div>
          <p className="font-display text-lg text-ink">{t("tagline")}</p>
          <p className="text-sm text-muted">{t("promise")}</p>
          <p className="text-sm text-muted">{t("data")}</p>
        </div>
        <ul className="grid content-start gap-2 text-sm font-bold text-indigo">
          <li><Link href="/scholarships" className="inline-flex items-center gap-2 hover:underline"><Compass className="h-4 w-4" />{n("scholarships")}</Link></li>
          <li><Link href="/guides" className="inline-flex items-center gap-2 hover:underline"><BookOpen className="h-4 w-4" />{n("guides")}</Link></li>
          <li><Link href="/changelog" className="inline-flex items-center gap-2 hover:underline"><FileCheck2 className="h-4 w-4" />{n("changelog")}</Link></li>
          <li><Link href="/settings" className="inline-flex items-center gap-2 hover:underline"><Settings className="h-4 w-4" />{n("settings")}</Link></li>
        </ul>
      </div>
      <p className="border-t border-line py-4 text-center text-xs text-muted">{t("made")}</p>
    </footer>
  );
}
