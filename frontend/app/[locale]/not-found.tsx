import { useTranslations } from "next-intl";
import { Empty, btn } from "@/components/ui";
import { Link } from "@/i18n/routing";

export default function NotFound() {
  const t = useTranslations("notFound");
  const n = useTranslations("nav");
  return (
    <div className="mx-auto max-w-lg py-10">
      <Empty title={t("title")}>
        <p className="text-muted">{t("lead")}</p>
        <Link href="/scholarships" className={btn.primary}>{n("scholarships")}</Link>
      </Empty>
    </div>
  );
}
