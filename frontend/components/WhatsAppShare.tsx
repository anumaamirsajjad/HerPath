"use client";

/** Opens WhatsApp with `text` plus the current page URL. Built on click so SSR and client markup match. */
export default function WhatsAppShare({ text, label, onShare }: { text: string; label: string; onShare?: () => void }) {
  return (
    <button type="button" className="rounded bg-green-600 px-3 py-2 text-white"
      onClick={() => {
        onShare?.();
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${window.location.href}`)}`, "_blank", "noopener");
      }}>
      {label}
    </button>
  );
}
