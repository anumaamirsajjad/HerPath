"use client";
import { useTranslations } from "next-intl";

export default function Error({ reset }: { reset: () => void }) {
  const t = useTranslations("common");
  return (
    <div className="space-y-3 py-10 text-center">
      <p role="alert">{t("error")}</p>
      <button onClick={reset} className="rounded border px-3 py-2">↻</button>
    </div>
  );
}
