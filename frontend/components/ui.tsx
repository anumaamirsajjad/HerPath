import { Hoop, Spool } from "@/components/art";
import type { Status, Tab } from "@/lib/types";

/** Class helpers rather than wrapper components, so Links, buttons and anchors share one look. */
export const btn = {
  primary: "inline-flex items-center justify-center gap-2 rounded-full bg-indigo px-5 py-3 font-bold text-white shadow-[var(--shadow-lift)] transition hover:bg-[#28358a] active:scale-[.98] disabled:opacity-60",
  accent: "inline-flex items-center justify-center gap-2 rounded-full bg-saffron px-5 py-3 font-bold text-ink transition hover:bg-[#f7b631] active:scale-[.98] disabled:opacity-60",
  ghost: "inline-flex items-center justify-center gap-2 rounded-full border-2 border-line bg-card px-4 py-2.5 font-bold text-indigo transition hover:border-indigo active:scale-[.98] disabled:opacity-60",
  whatsapp: "inline-flex items-center justify-center gap-2 rounded-full bg-[#1f9d55] px-5 py-3 font-bold text-white transition hover:bg-[#188a49] active:scale-[.98]",
  link: "font-bold text-indigo underline decoration-saffron decoration-2 underline-offset-4 hover:decoration-rani",
};
export const field = "mt-1.5 w-full rounded-xl border-2 border-line bg-card px-3.5 py-3 text-base transition focus:border-indigo focus:outline-none";
export const card = "rounded-[var(--radius-card)] border border-line bg-card";

/** Colour per match state. Kept in one place so tabs, pills and the gap timeline agree. */
export const TONE: Record<Tab | Status | "needs_info", { dot: string; soft: string; text: string }> = {
  apply_now: { dot: "bg-leaf", soft: "bg-leaf-soft", text: "text-leaf" },
  met: { dot: "bg-leaf", soft: "bg-leaf-soft", text: "text-leaf" },
  ready: { dot: "bg-[#0f8b8d]", soft: "bg-[#dcf2f2]", text: "text-[#0b6f71]" },
  almost: { dot: "bg-saffron", soft: "bg-saffron-soft", text: "text-[#8a5a00]" },
  fixable: { dot: "bg-saffron", soft: "bg-saffron-soft", text: "text-[#8a5a00]" },
  future: { dot: "bg-sky", soft: "bg-sky-soft", text: "text-sky" },
  fixable_later: { dot: "bg-sky", soft: "bg-sky-soft", text: "text-sky" },
  needs_info: { dot: "bg-rani", soft: "bg-rani-soft", text: "text-rani" },
  not_eligible: { dot: "bg-muted", soft: "bg-[#eceaf2]", text: "text-muted" },
};

export function Pill({ tone, children }: { tone: keyof typeof TONE; children: React.ReactNode }) {
  const t = TONE[tone];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${t.soft} ${t.text}`}>
      <span className={`h-2 w-2 rounded-full ${t.dot}`} />{children}
    </span>
  );
}

/** Readiness score as a ring: filled share of requirements met. */
export function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const r = 20, c = 2 * Math.PI * r;
  const color = score === 100 ? "#1e8a5b" : score >= 60 ? "#f2a516" : "#d6246e";
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} role="img" aria-label={`${score}%`} className="shrink-0 -rotate-90">
      <circle cx="24" cy="24" r={r} fill="none" stroke="#eceaf4" strokeWidth="5" />
      <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={`${(score / 100) * c} ${c}`} className="transition-[stroke-dasharray] duration-700" />
      <text x="24" y="24" dy=".35em" textAnchor="middle" className="rotate-90 fill-ink text-[12px] font-bold" style={{ transformOrigin: "24px 24px" }}>{score}</text>
    </svg>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className={`${card} flex flex-col items-center gap-3 px-6 py-10 text-center`}>
      <Hoop />
      <p className="font-display text-lg font-bold text-indigo">{title}</p>
      {children}
    </div>
  );
}

export function Loading({ label, rows = 3 }: { label: string; rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <div className="flex items-center gap-2 text-muted"><Spool className="h-7 w-7 animate-pulse" /><span>{label}</span></div>
      {Array.from({ length: rows }, (_, i) => <div key={i} className="skeleton h-24" />)}
    </div>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return <p role="alert" className="rounded-xl border-2 border-rani/30 bg-rani-soft px-4 py-3 font-bold text-rani">{children}</p>;
}

export function PageTitle({ title, lead, children }: { title: string; lead?: string; children?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-indigo sm:text-4xl">{title}</h1>
        {lead && <p className="mt-1.5 max-w-prose text-muted">{lead}</p>}
      </div>
      {children}
    </header>
  );
}
