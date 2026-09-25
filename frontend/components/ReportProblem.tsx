"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { api, errorText } from "@/lib/api";

export default function ReportProblem({ slug }: { slug: string }) {
  const t = useTranslations("scholarship");
  const c = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (sent) return <p className="text-sm">{t("reportSent")}</p>;
  const issues = process.env.NEXT_PUBLIC_ISSUES_URL;
  if (!open) return (
    <p className="text-sm">
      <button onClick={() => setOpen(true)} className="underline">{t("report")}</button>
      {issues && <> · <a href={issues} target="_blank" rel="noopener" className="underline">{t("reportPublic")}</a></>}
    </p>);
  return (
    <form className="space-y-2" onSubmit={async (e) => {
      e.preventDefault(); setError(null);
      try { await api("reports", { method: "POST", body: JSON.stringify({ scholarship: slug, message: msg }) }); setSent(true); }
      catch (err) { setError(errorText(err, c("error"))); }
    }}>
      <textarea required maxLength={2000} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t("reportPlaceholder")} className="w-full rounded border p-2" />
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button className="rounded border px-3 py-1">{t("report")}</button>
    </form>
  );
}
