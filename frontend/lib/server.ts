// Server-side API reads for pages that must render with content (link previews, slow first loads).
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

/** GET a public API path in `lang`. Returns null on 404; throws on other failures so error.tsx shows. */
export async function getJSON<T>(path: string, lang: string): Promise<T | null> {
  // ponytail: no caching; add `next: { revalidate }` if Django load from page views matters.
  const res = await fetch(`${BASE}/${path}${path.includes("?") ? "&" : "?"}lang=${lang}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}
