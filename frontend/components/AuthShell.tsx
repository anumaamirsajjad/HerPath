import { Hem, LogoMark, Panel } from "@/components/art";
import { card } from "@/components/ui";

/** Shared frame for log in, sign up and password pages: form on one side, phulkari panel on the other. */
export default function AuthShell({ title, lead, children }: { title: string; lead?: string; children: React.ReactNode }) {
  return (
    <div className={`${card} mx-auto grid max-w-4xl overflow-hidden md:grid-cols-[1fr_1.1fr]`}>
      <div className="hidden md:block"><Panel /></div>
      <div className="md:hidden"><Hem className="h-3 w-full" /></div>
      <div className="p-6 sm:p-10">
        <LogoMark className="mb-5 h-10 w-10" />
        <h1 className="font-display text-3xl font-bold tracking-tight text-indigo">{title}</h1>
        {lead && <p className="mt-2 text-muted">{lead}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
