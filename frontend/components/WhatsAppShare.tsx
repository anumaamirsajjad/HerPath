"use client";
import { MessageCircle } from "lucide-react";
import { btn } from "@/components/ui";

/** Opens WhatsApp with `text` plus the current page URL. Built on click so SSR and client markup match. */
export default function WhatsAppShare({ text, label, onShare, className = btn.whatsapp }: { text: string; label: string; onShare?: () => void; className?: string }) {
  return (
    <button type="button" className={className}
      onClick={() => {
        onShare?.();
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${window.location.href}`)}`, "_blank", "noopener");
      }}>
      <MessageCircle className="h-5 w-5" />{label}
    </button>
  );
}
