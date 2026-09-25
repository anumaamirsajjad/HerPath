import { Briefcase, CreditCard, FileBadge, FileText, GraduationCap, Landmark, Languages, Mail, NotebookPen, Plane, Stamp } from "lucide-react";

/** Icon and group for each guide slug; unknown slugs fall back to a document icon under "documents". */
export const GUIDE_META: Record<string, { icon: typeof FileText; group: "documents" | "tests" | "profile" }> = {
  "cnic-bform": { icon: CreditCard, group: "documents" },
  "domicile-certificate": { icon: Landmark, group: "documents" },
  "income-certificate": { icon: FileText, group: "documents" },
  passport: { icon: Plane, group: "documents" },
  "hec-attestation": { icon: Stamp, group: "documents" },
  "ibcc-equivalence": { icon: FileBadge, group: "documents" },
  "english-medium-letter": { icon: Languages, group: "documents" },
  "recommendation-letters": { icon: Mail, group: "documents" },
  ielts: { icon: NotebookPen, group: "tests" },
  toefl: { icon: NotebookPen, group: "tests" },
  gre: { icon: NotebookPen, group: "tests" },
  "sixteen-years": { icon: GraduationCap, group: "profile" },
  "work-experience": { icon: Briefcase, group: "profile" },
};
export const metaFor = (slug: string) => GUIDE_META[slug] ?? { icon: FileText, group: "documents" as const };
