"use client";
import { RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Empty, btn } from "@/components/ui";

export default function Error({ reset }: { reset: () => void }) {
  const t = useTranslations("common");
  return (
    <div className="mx-auto max-w-lg py-10" role="alert">
      <Empty title={t("error")}><button onClick={reset} className={btn.primary}><RotateCw className="h-5 w-5" />{t("retry")}</button></Empty>
    </div>
  );
}
