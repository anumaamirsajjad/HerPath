import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function NotFound() {
  const t = useTranslations("nav");
  return (
    <div className="space-y-3 py-10 text-center">
      <p className="text-2xl font-bold">404</p>
      <Link href="/scholarships" className="underline">{t("scholarships")}</Link>
    </div>
  );
}
