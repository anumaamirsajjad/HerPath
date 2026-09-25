# Scholarship data: adding, updating and verifying listings

HerPath's scholarships and fix-it guides live as files in Git (`backend/data/`) and are loaded into the
database by `python manage.py seed`. Curators can also edit in the admin panel. Neither path silently
overwrites the other.

```
research ─▶ backend/data/*.json ─▶ seed --dry-run ─▶ review ─▶ commit ─▶ seed (deploy) ─▶ database ─▶ site
                     ▲                                                                   │
                     └──────────────── export_data ◀── admin panel edits ◀──────────────┘
```

Commands below are written for the Docker setup. Without Docker, run the same `python manage.py …`
inside `backend/` with the virtualenv active.

```bash
alias hp='docker compose exec backend python manage.py'   # optional shortcut
```

## Recipes

### Find or update scholarships with Claude
In Claude Code, from the repo root:

| You type | Claude does |
|---|---|
| `/scholarships find women-only master's in Europe` | Searches, verifies on official pages, proposes candidates, adds the ones you approve |
| `/scholarships add Chevening 2027` | Adds one programme |
| `/scholarships update fulbright-masters` | Re-checks one listing and edits its file |
| `/scholarships review-due` | Re-checks every listing whose `next_check` has arrived |

Each run edits files under `backend/data/`, writes a report to `docs/scholarship-research/`, and stops before
seeding for real, committing or pushing. You then:

```bash
git diff backend/data                         # read what changed
hp seed --dry-run                             # see exactly what the database would get
docker compose exec backend pytest -q scholarships
hp seed                                       # load it
git add backend/data docs/scholarship-research && git commit
```

The research rules Claude follows are in `.claude/skills/scholarships/SKILL.md`: official sources only, only
stated criteria become matching rules, never invent, Urdu for every field, every source recorded.

### Add a scholarship by hand
```bash
hp scaffold_scholarship punjab-merit-award    # writes backend/data/scholarships/punjab-merit-award.json
```
Fill in every `TODO`, write the Urdu fields, add `sources`, set `"is_published": true`, then dry-run, test,
seed and commit as above. The template starts unpublished, so a half-finished file never reaches girls.

### Update a listing (new cycle, new deadline, changed rules)
Edit its JSON file: e.g. `"status": "open"`, `"deadline": "2027-03-31"`, `"last_verified"` to today, and append
a source:
```json
"sources": [ ...,
  { "url": "https://www.peef.org.pk/news/2027-call", "checked": "2027-02-01", "note": "2027 call announced, deadline 31 March" } ]
```
`seed` writes a public change-log entry listing the changed fields and that note.

### Monthly verification routine
```bash
hp due_for_review               # listings whose next_check has arrived
hp due_for_review --within 30   # and those due in the next 30 days
```
Re-check each (or `/scholarships review-due`), update `last_verified` and `next_check`.

### Quick fix in the admin panel
Edit at `/admin/`. The scholarship list's **Data file** column shows "Edited here: run export_data" until
the edit is written back:
```bash
hp export_data                  # writes edited records back to backend/data
git diff backend/data && git commit
```
If you skip this, the edit is still safe: `seed` keeps it and reminds you (see below).

### Deploy
Docker runs `seed` on every backend start. On Railway, after merging:
```bash
railway run python manage.py seed --dry-run
railway run python manage.py seed
```

## How `seed` decides

`seed` remembers a fingerprint of what it last loaded for each record (`seed_hash`), so it knows which side changed.

| File changed since last seed | Admin edit since last seed | `seed` does |
|---|---|---|
| no | no | nothing |
| yes | no | updates the database, adds a change-log entry |
| no | yes | **keeps the admin edit**, reminds you to `export_data` |
| yes | yes | **conflict**: skips the record and names it |

Resolve a conflict by choosing a side: `hp seed --prefer json` (use the file) or `hp seed --prefer admin`
(keep the admin edit, then `export_data`). `--strict` makes conflicts an error (useful in CI);
`--only <slug>` limits a run to one record. Records loaded before fingerprints existed take the file's values once.

## Command reference

| Command | Purpose |
|---|---|
| `seed [--dry-run] [--prefer json\|admin] [--only SLUG] [--strict]` | Load files into the database |
| `export_data [--all] [--only SLUG]` | Write admin edits (or everything) back to files |
| `scaffold_scholarship SLUG` | Create a new listing from a template |
| `due_for_review [--within DAYS]` | List listings due for re-verification |

## The scholarship file

One file per scholarship: `backend/data/scholarships/<slug>.json`. The file name must equal `slug`, and the slug
never changes (it is in every shared link). Unknown keys are rejected, so typos fail loudly.

| Field | Meaning |
|---|---|
| `slug`, `provider`, `location` (`pakistan`/`abroad`), `country` | Identity. `country` should be one of the names translated in `frontend/messages/*.json` → `countries` (add a new one there) |
| `name_*`, `summary_*`, `coverage_*`, `who_for_*`, `application_steps_*`, `family_summary_*` | Text, each as `_en` and `_ur`. Steps as `1. …\n2. …` render as a numbered list. `family_summary` is written for parents |
| `levels` | `undergraduate`, `masters`, `phd`. **Also enforced**: a girl is only matched for the levels listed |
| `types` (`need`,`merit`), `covers` (`tuition`,`stipend`,`hostel`,`airfare`,`insurance`,`books`), `funding` (`full`,`partial`,`tuition_only`,`stipend_only`) | Filters and card badges |
| `women_only`, `female_quota`, `allows_other_scholarship`, `university_type` (`any`,`public`,`private`,`partner`), `provinces`, `income_limit`, `test_requirement` (`required`,`waiver_possible`,`none`), `special_categories`, `required_documents` | Filters and display. They do **not** decide eligibility — `requirements` does |
| `requirements` | The matching rules (next section) |
| `usual_opening_month` (1–12 or null), `status` (`open`,`closed`,`expected`), `deadline` (date or null) | The cycle. Without a real deadline HerPath estimates one: opening month + 60 days, labelled as an estimate |
| `official_link`, `last_verified`, `next_check`, `is_published` | Trust and upkeep |
| `sources` | Research trail (file only): `[{"url", "checked", "note"}]`, newest last |

## Writing rules

A rule checks one profile field. The girl's profile fields:

`age`, `domicile` (`Punjab`,`Sindh`,`KP`,`Balochistan`,`Gilgit-Baltistan`,`AJK`,`Islamabad`), `district`, `categories`
(`orphan`,`disability`,`minority`,`bps1to4`,`bisp`), `board`, `matricPercent`, `interPercent`, `interStream`, `level`
(highest completed or in progress: `intermediate`,`bachelors`,`masters`,`phd`), `targetLevel` (what she wants to study
next: `undergraduate`,`masters`,`phd`), `degree`, `yearsOfEducation`, `cgpa`, `universityType` (`public`,`private`),
`enrolledUniversity`, `tests.<mdcat|ecat|nat|gat|hat|ielts|toefl|duolingo|gre>`, `monthlyIncome`, `workYears`,
`volunteering`, `leadership`, `documents.<cnic|domicile|passport|incomeCertificate|hecAttestation|ibccEquivalence|recommendationLetters|englishMediumLetter>`,
`studyIn`, `preferredCountries`, `fields`.

```json
{ "field": "domicile", "rule": "in", "value": ["Punjab"], "fixable": false,
  "message": { "en": "Only for students with Punjab domicile", "ur": "صرف پنجاب ڈومیسائل والی طالبات کے لیے" } }
```
- **Operators:** `==`, `!=`, `>=`, `<=`, `in` (value is a list), `contains` (profile list contains value), `has` (true/ticked; no `value`).
- **`fixable: false`** — something she cannot change (domicile, age, marks already earned). Failing it means "Not eligible", so only use it for criteria the source states as hard limits.
- **`fixable: true`** — something she can obtain. Needs `fixGuide` (a slug in `backend/data/guides/`) and `daysNeeded` equal to that guide's `days_needed`.
- **Any one of** / **all of:** `{ "anyOf": [rules…], "message": {…} }` / `{ "allOf": [...] }`. For English tests list IELTS, TOEFL and, where accepted, `documents.englishMediumLetter`.
- **Only in some cases:** add `"appliesWhen": { "field": "targetLevel", "rule": "==", "value": "masters" }`. Use `targetLevel` for "Master's applicants must be…", not `level`.
- A missing profile answer never fails silently: HerPath shows "needs more information" instead of "not eligible".

## Guides

`backend/data/guides/<slug>.en.md` and `<slug>.ur.md`. First line `# Title`; the English file has a
`days_needed: N` line. Everything else is Markdown. They follow the same seed/export rules as scholarships.

## Checking a listing

```bash
docker compose exec -T backend python manage.py shell -c "
import datetime as dt; from matching.services import evaluate_scholarship; from scholarships.models import Scholarship
s = Scholarship.objects.get(slug='peef-undergraduate')
girl = {'targetLevel': 'undergraduate', 'domicile': 'Punjab', 'interPercent': 78, 'monthlyIncome': 40000, 'documents': {'cnic': True}}
r = evaluate_scholarship(s, girl, dt.date.today()); print(r['tab'], r['score'], [(x.get('field', x['kind']), x['status']) for x in r['requirements']])"
```
Try one girl who should qualify and one who shouldn't. A qualifying girl marked "not eligible" means a rule is too strict.

## Before you merge

- [ ] Every fact traces to a source in `sources`; anything unverifiable is in the report, not in a rule
- [ ] Pakistan is eligible in the current cycle
- [ ] Every `_en` field has its `_ur` field
- [ ] `seed --dry-run` shows only the changes you expect, and no conflicts
- [ ] `pytest -q scholarships` passes (update the listing count in `test_seed.py` when adding)
- [ ] A research report is in `docs/scholarship-research/`
