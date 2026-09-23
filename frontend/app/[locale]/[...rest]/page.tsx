import { notFound } from "next/navigation";

// Unknown paths under a locale render the localized not-found page (inside the layout, with nav).
export default function CatchAll() { notFound(); }
