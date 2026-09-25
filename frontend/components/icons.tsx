import { BedDouble, BookOpen, GraduationCap, HeartPulse, Plane, Wallet } from "lucide-react";

/** One icon per thing a scholarship pays for, reused on cards, detail and family pages. */
export const COVER_ICON = { tuition: GraduationCap, stipend: Wallet, hostel: BedDouble, airfare: Plane, insurance: HeartPulse, books: BookOpen } as const;
export type Cover = keyof typeof COVER_ICON;
