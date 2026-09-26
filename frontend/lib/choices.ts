// Must equal backend/accounts/choices.py
export const PROVINCES = ["Punjab", "Sindh", "KP", "Balochistan", "Gilgit-Baltistan", "AJK", "Islamabad"];
export const CATEGORIES = ["orphan", "disability", "minority", "bps1to4", "bisp"];
export const BOARDS = ["BISE Punjab", "BISE Sindh", "BISE KP", "BISE Balochistan", "FBISE", "AJK Board", "Cambridge"];
export const STREAMS = ["pre-medical", "pre-engineering", "ics", "commerce", "humanities"];
export const LEVELS = ["intermediate", "bachelors", "masters", "phd"];
export const UNIVERSITY_TYPES = ["public", "private"];
export const TESTS = ["mdcat", "ecat", "nat", "gat", "hat", "ielts", "toefl", "duolingo", "gre"];
export const DOCUMENTS = ["cnic", "domicile", "passport", "incomeCertificate", "hecAttestation", "ibccEquivalence", "recommendationLetters", "englishMediumLetter"];
export const STUDY_IN = ["pakistan", "abroad", "both"];
export const TARGET_LEVELS = ["undergraduate", "masters", "phd"];
// Official Cambridge syllabus titles, per level
export const CAMBRIDGE_SUBJECTS: Record<string, string[]> = {
  "O-Levels": ["English Language", "Mathematics (Syllabus D)", "Additional Mathematics", "Pakistan Studies", "Islamiyat", "Urdu – First Language", "Urdu – Second Language", "Physics", "Chemistry", "Biology", "Computer Science", "Economics", "Accounting", "Business Studies", "Commerce", "Sociology", "Statistics", "Literature in English", "Environmental Management", "Art and Design"],
  "A-Levels": ["Mathematics", "Further Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "Economics", "Accounting", "Business", "Sociology", "Psychology", "Law", "English Language", "English General Paper", "Literature in English", "Urdu", "Islamic Studies", "History", "Geography", "Media Studies", "Art and Design"],
};
// Subject keys saved before the official names above, mapped per level.
const LEGACY_SUBJECTS: Record<string, [string, string]> = { // key: [O-Levels name, A-Levels name]
  english: ["English Language", "English Language"], mathematics: ["Mathematics (Syllabus D)", "Mathematics"],
  physics: ["Physics", "Physics"], chemistry: ["Chemistry", "Chemistry"], biology: ["Biology", "Biology"],
  computerScience: ["Computer Science", "Computer Science"], economics: ["Economics", "Economics"],
  accountancy: ["Accounting", "Accounting"], businessStudies: ["Business Studies", "Business"],
  generalPaper: ["English General Paper", "English General Paper"], urdu: ["Urdu – Second Language", "Urdu"],
  islamiat: ["Islamiyat", "Islamic Studies"],
};
export function renameLegacySubjects(subjects: Record<string, string | null> = {}, level?: string | null) {
  const i = level === "A-Levels" ? 1 : 0;
  return Object.fromEntries(Object.entries(subjects).map(([k, g]) => [LEGACY_SUBJECTS[k]?.[i] ?? k, g]));
}
export const GRADES = ["a*", "a", "b", "c", "d", "e", "u"];
