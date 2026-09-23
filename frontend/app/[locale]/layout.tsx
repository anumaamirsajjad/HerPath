import type { Metadata } from "next";
import { Inter, Noto_Naskh_Arabic } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { AuthProvider } from "@/lib/auth";
import Nav from "@/components/Nav";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const naskh = Noto_Naskh_Arabic({ subsets: ["arabic"], variable: "--font-naskh" });

export const metadata: Metadata = { title: "HerPath", description: "Scholarships for girls in Pakistan" };
export function generateStaticParams() { return routing.locales.map((locale) => ({ locale })); }

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <html lang={locale} dir={locale === "ur" ? "rtl" : "ltr"} className={`${inter.variable} ${naskh.variable}`}>
      <body className={locale === "ur" ? "font-urdu leading-loose" : "font-latin"}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <Nav />
            <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
