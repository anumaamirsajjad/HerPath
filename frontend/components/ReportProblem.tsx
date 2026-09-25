"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Flag } from "lucide-react";
import { ErrorNote, btn, field } from "@/components/ui";
import { api, errorText } from "@/lib/api";

export default function ReportProblem({ slug }: { slug: string }) {
  const t = useTranslations("scholarship");
  const c = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (sent) return <p className="pop text-sm font-bold text-leaf">{t("reportSent")}</p>;
  const issues = process.env.NEXT_PUBLIC_ISSUES_URL;
  if (!open) return (
    <p className="text-sm">
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 font-bold text-muted hover:text-rani"><Flag className="h-4 w-4" />{t("report")}</button>
      {issues && <> · <a href={issues} target="_blank" rel="noopener" className="underline">{t("reportPublic")}</a></>}
    </p>);
  return (
    <form className="rise max-w-xl space-y-2" onSubmit={async (e) => {
      e.preventDefault(); setError(null);
      try { await api("reports", { method: "POST", body: JSON.stringify({ scholarship: slug, message: msg }) }); setSent(true); }
      catch (err) { setError(errorText(err, c("error"))); }
    }}>
      <textarea required maxLength={2000} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t("reportPlaceholder")} className={`${field} mt-0 min-h-24`} />
      {error && <ErrorNote>{error}</ErrorNote>}
      <button className={btn.ghost}>{t("report")}</button>
    </form>
  );
}
