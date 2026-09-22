# HerPath Version 1: Design Spec

Date: 2026-09-23
Status: approved in conversation, pending written review
Scope: everything in README Section 4 "Version 1" (4.1 to 4.11), Section 5 data
maintenance features (change log, report a problem), Section 8 counters.

## 1. Decisions that override the README

The README describes a static, no-server product. These decisions replace it:

| README says | This spec says |
|---|---|
| Profile in browser local storage, no accounts | Email + password accounts, profile stored in Postgres |
| Matching in client-side JavaScript | Matching in a Python rule engine behind a REST API |
| Scholarship JSON file in Git | Scholarships in Postgres, edited in Django admin, seeded from JSON files in Git |
| PIN, export/import, "Delete my profile" | PIN and export/import dropped. "Delete my account" kept. |
| Static export on Vercel | Next.js on Vercel calling a Django API at runtime |

README Sections 8, 9 and 10 will be rewritten as part of the plan.

## 2. Architecture

Monorepo:

```
backend/    Django 5, Django REST Framework, Postgres
frontend/   Next.js 15 (App Router), TypeScript, Tailwind, next-intl
```

Django owns users, profiles, scholarships, guides, the rule engine, saved
scholarships, counters, change log, problem reports and admin. Next.js is a
thin client over the JSON API. Public pages need no login. Filtering happens in
the browser over the full scholarship list (dataset is tens of rows).

Hosting: Railway (Django, gunicorn, whitenoise, Postgres) and Vercel (Next.js).
CORS via django-cors-headers. Email via SMTP env vars in prod, console in dev.

Backend dependencies: django, djangorestframework, djangorestframework-simplejwt,
django-cors-headers, psycopg[binary], gunicorn, whitenoise, dj-database-url,
markdown, pytest-django. Nothing else without a stated reason.

Frontend dependencies: next, react, tailwindcss, next-intl. Nothing else without
a stated reason.

## 3. Auth

- Custom `User` with `email` as `USERNAME_FIELD`, no username.
- SimpleJWT: `POST /api/auth/signup`, `POST /api/auth/login` (returns access +
  refresh), `POST /api/auth/refresh`, `POST /api/auth/password-reset`
  (sends email with token link), `POST /api/auth/password-reset/confirm`,
  `DELETE /api/auth/me` (deletes user and everything owned).
- Frontend stores tokens in localStorage and attaches `Authorization: Bearer`.
  `# ponytail:` tokens in localStorage, move to httpOnly cookies if XSS becomes a concern.
- Password reset uses Django's built-in token generator; the email links to
  `{FRONTEND_URL}/{locale}/reset-password?uid=..&token=..`.

## 4. Data model

### accounts.User
Email, password, is_active, is_staff, date_joined.

### accounts.Profile
- `user` OneToOne
- `data` JSONField, validated by `ProfileSerializer` on write
- `analytics_opt_out` bool, default False
- `created_at`, `updated_at`

`data` shape (all keys optional, null when unknown):

```json
{
  "age": 19,
  "domicile": "Punjab",
  "district": "Lahore",
  "categories": ["orphan", "disability", "minority", "bps1to4", "bisp"],
  "board": "BISE Punjab",
  "matricPercent": 85.0,
  "interPercent": 78.0,
  "interStream": "pre-medical",
  "level": "intermediate",
  "degree": null,
  "yearsOfEducation": 12,
  "cgpa": null,
  "universityType": null,
  "enrolledUniversity": null,
  "tests": { "mdcat": null, "ecat": null, "nat": null, "gat": null, "hat": null,
             "ielts": null, "toefl": null, "duolingo": null, "gre": null },
  "monthlyIncome": 45000,
  "workYears": 0,
  "volunteering": false,
  "leadership": false,
  "documents": { "cnic": true, "domicile": false, "passport": false,
                 "incomeCertificate": false, "hecAttestation": false,
                 "ibccEquivalence": false, "recommendationLetters": false,
                 "englishMediumLetter": false },
  "studyIn": "both",
  "preferredCountries": ["UK", "Germany"],
  "fields": ["computer-science"]
}
```

Allowed values for enums are fixed in `accounts/choices.py` and mirrored in the
frontend form. `level` is one of `intermediate`, `bachelors`, `masters`, `phd`
(highest completed or in progress). `domicile` is a province or territory name.

### scholarships.Scholarship
- `slug` (pk-like, unique), `provider`, `location` (`pakistan` | `abroad`),
  `country`
- Bilingual text, each as `_en` and `_ur`: `name`, `summary`, `coverage`,
  `who_for`, `application_steps` (Markdown), `family_summary`
- `levels` ArrayField of `undergraduate` | `masters` | `phd`
- `types` ArrayField of `need` | `merit`
- `covers` ArrayField of `tuition` | `stipend` | `hostel` | `airfare` |
  `insurance` | `books`
- `funding` one of `full` | `partial` | `tuition_only` | `stipend_only`
- `women_only` bool, `female_quota` bool, `allows_other_scholarship` bool
- `university_type` one of `any` | `public` | `private` | `partner`
- `provinces` ArrayField (empty = all)
- `income_limit` int nullable (PKR per month)
- `test_requirement` one of `required` | `waiver_possible` | `none`
- `special_categories` ArrayField
- `required_documents` ArrayField of document keys (display only; the rules
  are the source of truth for gaps)
- `requirements` JSONField: list of rule nodes (Section 5)
- `usual_opening_month` int 1..12 nullable
- `status` one of `open` | `closed` | `expected`
- `deadline` date nullable
- `official_link` URL
- `last_verified` date, `next_check` date
- `is_published` bool

### scholarships.ChangeLog
`scholarship` FK, `date`, `source` URL, `note`. Public, read-only via API.

### scholarships.ProblemReport
`scholarship` FK nullable, `message`, `created_at`. Anonymous create, throttled
to 5 per hour per IP.

### scholarships.Guide
`slug`, `title_en`, `title_ur`, `body_en`, `body_ur` (Markdown), `days_needed`.
API returns body rendered to HTML with the `markdown` package. Content is
admin-authored, so it is trusted HTML.

### saved.SavedScholarship
`user` FK, `scholarship` FK, `created_at`, unique together.

### counters.Counter
`key` unique, `count` int. Keys: `profiles_created`, `gaps_closed`,
`moved_to_apply_now`, `family_shared`.

## 5. Rule engine

Location: `backend/matching/engine.py`. Pure functions, no ORM.

### Rule node

```json
{ "field": "tests.ielts", "rule": ">=", "value": 6.5,
  "fixable": true, "fixGuide": "ielts", "daysNeeded": 60,
  "message": { "en": "...", "ur": "..." },
  "appliesWhen": { "field": "level", "rule": "==", "value": "masters" } }
```

Group node:

```json
{ "anyOf": [ ...rule nodes... ], "message": { "en": "...", "ur": "..." } }
{ "allOf": [ ...rule nodes... ], "message": { "en": "...", "ur": "..." } }
```

Operators: `==`, `!=`, `>=`, `<=`, `in` (value is a list, profile value must be
in it), `has` (profile value is truthy), `contains` (profile list contains
value). `field` is a dotted path into profile `data`. A missing or null profile
value never satisfies a rule.

### Evaluation

`evaluate(scholarship, profile_data, today) -> MatchResult`

For each top-level node:
1. If `appliesWhen` is present and evaluates false, skip the node (not counted).
2. Leaf: compute `passed`. If passed, status `met`. If not passed and
   `fixable` is false, status `not_eligible`. If not passed and fixable:
   - If scholarship has a hard `deadline`: `start_by = deadline - daysNeeded`.
     If `start_by < today`, status `fixable_later`, else `fixable`.
   - If no hard deadline: status `fixable`, `start_by` null.
3. `allOf`: status is the worst of its children (ordering below).
4. `anyOf`: if any child is `met`, status `met`. Otherwise status is the best
   of its children, and children are sorted so the one with the smallest
   `daysNeeded` comes first.

Severity order, best to worst: `met`, `fixable`, `fixable_later`, `not_eligible`.

`MatchResult`:
- `requirements`: list of `{ status, message, fixGuide, daysNeeded, startBy,
  field, missingFromProfile: bool, options: [...] }` (options only for anyOf)
- `met_count`, `total_count` (each top-level applicable node counts as one)
- `tab`: `not_eligible` if any node is not_eligible; else `future` if any is
  fixable_later; else `almost` if any is fixable; else `apply_now`
- `score`: `round(100 * met_count / total_count)`; null when tab is
  not_eligible

`# ponytail:` no estimated deadline for `expected` cycles. Gaps stay fixable
and the UI shows the usual opening month. Add an estimated-deadline field if
users need start-by dates before a cycle is announced.

### Unlocks

`unlocks(profile_data, scholarships, today)`: for each document key in
`documents` that is false, count scholarships whose result tab is not
`not_eligible` and whose requirement list contains an unmet leaf with
`field == "documents.<key>"`. Returns `{ documentKey: count }`.

### Conflicts

For a user's saved set, two scholarships conflict when either has
`allows_other_scholarship == false`. Returned as a list of slug pairs.

## 6. API

Base `/api/`. JSON. Auth is Bearer JWT unless marked public.

| Method | Path | Notes |
|---|---|---|
| POST | auth/signup | public |
| POST | auth/login | public |
| POST | auth/refresh | public |
| POST | auth/password-reset | public |
| POST | auth/password-reset/confirm | public |
| GET | auth/me | id, email, has_profile |
| DELETE | auth/me | deletes everything owned |
| GET | profile | 404 until created |
| PUT | profile | create or replace; runs counters diff |
| PATCH | profile | partial (used for `analytics_opt_out`) |
| GET | scholarships | public, published only, all filter columns, no rules |
| GET | scholarships/{slug} | public, includes rules and required_documents |
| GET | match | all published scholarships evaluated, grouped by tab |
| GET | match/{slug} | one MatchResult |
| GET | match/unlocks | unlocks map |
| GET | saved | list with `conflicts` |
| POST | saved | `{ slug }` |
| DELETE | saved/{slug} | |
| GET | guides | public |
| GET | guides/{slug} | public, HTML body per locale |
| GET | changelog | public, newest first, optional `?scholarship=slug` |
| POST | reports | public, throttled |
| POST | counters/{key} | public, only `family_shared` accepted from clients |
| GET | counters | public, all keys |

Locale: `?lang=en|ur` selects which `_en`/`_ur` fields are returned as `name`,
`summary` and so on. Default `en`. Requirement messages are returned in both
languages and the client picks.

Errors: DRF default shape. 401 for missing token, 403 for no profile where one
is required (`match`, `saved` still work without a profile: `match` returns an
empty grouping and `has_profile: false`).

## 7. Counters

- `profiles_created`: incremented in the profile create path.
- On `PUT profile`, before saving, evaluate all scholarships against the old
  data and the new data. `gaps_closed` += number of (scholarship, field) leaf
  pairs that went from unmet to met. `moved_to_apply_now` += number of
  scholarships whose tab went from `almost` or `future` to `apply_now`.
- `family_shared`: client POSTs when the share button is tapped.
- If `profile.analytics_opt_out` is true, skip all increments for that user.
- Increments use `update(count=F("count") + n)`.

## 8. Frontend

Next.js App Router with `app/[locale]/...`. next-intl with `en` and `ur`
message files. `<html lang dir>` set per locale, `dir="rtl"` for `ur`. Urdu
font is Noto Naskh Arabic via `next/font/google`. Tailwind with logical
properties (`ms-`, `me-`, `ps-`, `pe-`) so RTL needs no overrides.

Pages:

| Route | Auth | Content |
|---|---|---|
| `/` | no | Landing, CTA to browse and to create profile |
| `/scholarships` | no | Full list fetched once, filters from README 4.2 applied client-side. Profile-aware filters (province, income) only when logged in. Shows tab badge per card when logged in. |
| `/scholarships/[slug]` | no | README 4.3 content. When logged in, gap analysis (README 4.4) with start-by dates, fastest option first for anyOf, fix guide links. Save button. WhatsApp share. Report a problem. Family Mode link. |
| `/results` | yes | Three tabs plus a "Not eligible" section with reasons. Each card shows score and gap count. |
| `/profile` | yes | Multi-step form, one step per README 4.1 section. Saves with PUT. |
| `/checklist` | yes | Document toggles saved via PUT profile, each showing "unlocks N more". |
| `/saved` | yes | Saved list, countdown per deadline, conflict warning. |
| `/guides/[slug]` | no | Rendered guide HTML. |
| `/family/[slug]` | no | Urdu by default. Family summary, coverage in PKR, legitimacy line, hostel line. WhatsApp share button that also POSTs `family_shared`. |
| `/changelog` | no | ChangeLog entries. |
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | no | |
| `/settings` | yes | Language, counters opt-out, delete account. |

Client state: one `api.ts` fetch wrapper that attaches the token and refreshes
on 401. Auth state from `auth/me` on load. No global state library.

WhatsApp share is a plain `https://wa.me/?text=` link.

## 9. Seed content

`backend/data/scholarships/*.json` (one per scholarship) and
`backend/data/guides/<slug>.<lang>.md`. Management command `seed` does
`update_or_create` by slug for both. Idempotent.

Scholarships (15):
Pakistan: hec-need-based, benazir-undergraduate, peef-undergraduate,
seef-undergraduate, hec-overseas-masters-phd, ihsan-trust-loan,
nust-need-based.
Abroad: fulbright-masters, chevening, commonwealth-masters, daad-epos,
turkiye-burslari, csc-chinese-government, stipendium-hungaricum,
erasmus-mundus.

Every entry has `last_verified` set to the seeding date and a change log entry
"Initial entry, values unverified" so the public change log is honest.

Guides (5): income-certificate, domicile-certificate, hec-attestation,
ibcc-equivalence, passport. English and Urdu.

## 10. Admin

Django admin registered for Scholarship (ChangeLog inline, JSON textarea for
requirements), Guide, ProblemReport (read-only list), Counter (read-only).
A `clean()` on Scholarship validates `requirements` with the engine's schema
check so a bad rule cannot be saved.

## 11. Testing

- `backend/matching/tests/`: operators, missing values, appliesWhen, allOf,
  anyOf ordering, start-by and fixable_later, tab assignment, score, unlocks,
  conflicts. This is the dense logic and gets full coverage.
- `backend/*/tests/`: one test per endpoint for the happy path and one for the
  auth failure. Counter diff test on profile update.
- Frontend: `next lint` and `tsc --noEmit` in CI. No component tests in V1.
- GitHub Actions: backend pytest against Postgres service, frontend lint and
  type check.

## 12. Out of scope

Everything in README Version 2, provider portal, SMS reminders, regional
languages, counsellor view, mentorship. Rate limiting beyond DRF throttles.
Estimated deadlines for expected cycles.
