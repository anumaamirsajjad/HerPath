"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useAuth } from "@/lib/auth";

export default function Nav() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const links: [string, string][] = user
    ? [["/scholarships", t("scholarships")], ["/results", t("results")], ["/checklist", t("checklist")], ["/saved", t("saved")], ["/profile", t("profile")], ["/settings", t("settings")]]
    : [["/scholarships", t("scholarships")], ["/login", t("login")], ["/signup", t("signup")]];
  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-4 py-3 text-sm">
        <Link href="/" className="font-bold text-emerald-700">HerPath</Link>
        {links.map(([href, label]) => <Link key={href} href={href} className="hover:underline">{label}</Link>)}
        {user && <button onClick={logout} className="hover:underline">{t("logout")}</button>}
        <Link href={pathname} locale={locale === "ur" ? "en" : "ur"} className="ms-auto rounded border px-2 py-1">{t("language")}</Link>
      </div>
    </nav>
  );
}
