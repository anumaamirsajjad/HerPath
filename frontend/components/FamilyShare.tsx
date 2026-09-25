"use client";
import WhatsAppShare from "@/components/WhatsAppShare";
import { api } from "@/lib/api";

export default function FamilyShare({ text, label }: { text: string; label: string }) {
  return <WhatsAppShare text={text} label={label}
    onShare={() => { api("counters/family_shared", { method: "POST" }).catch(() => {}); }} />;
}
