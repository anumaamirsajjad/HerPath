"use client";
import WhatsAppShare from "@/components/WhatsAppShare";
import { btn } from "@/components/ui";
import { api } from "@/lib/api";

export default function FamilyShare({ text, label }: { text: string; label: string }) {
  return <WhatsAppShare text={text} label={label} className={`${btn.whatsapp} w-full py-4 text-lg shadow-[var(--shadow-lift)]`}
    onShare={() => { api("counters/family_shared", { method: "POST" }).catch(() => {}); }} />;
}
