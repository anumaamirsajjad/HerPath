import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Bricolage_Grotesque, Noto_Naskh_Arabic } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { AuthProvider } from "@/lib/auth";
import Nav, { Footer } from "@/components/Nav";
import "../globals.css";

const atkinson = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-atkinson" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const naskh = Noto_Naskh_Arabic({ subsets: ["arabic"], weight: ["400", "600", "700"], variable: "--font-naskh" });

export const metadata: Metadata = { title: "HerPath", description: "Scholarships for girls in Pakistan" };
export function generateStaticParams() { return routing.locales.map((locale) => ({ locale })); }

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <html lang={locale} dir={locale === "ur" ? "rtl" : "ltr"} className={`${atkinson.variable} ${bricolage.variable} ${naskh.variable}`}>
      <body className={`min-h-screen ${locale === "ur" ? "font-urdu" : "font-latin"}`}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <Nav />
            <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
            <Footer />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
