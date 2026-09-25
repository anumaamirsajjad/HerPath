---
name: scholarships
description: Research, add, update and re-verify HerPath scholarship listings. Use when the user asks to find new scholarships, update or check an existing one, run the monthly review of listings that are due, or says "/scholarships". Modes - find <topic>, add <name or url>, update <slug>, review-due.
---

# HerPath scholarship research

HerPath tells girls whether they qualify for a scholarship. A wrong "not eligible", a wrong deadline or an invented
programme costs a real girl a real opportunity. Accuracy beats coverage every time.

Read `docs/SCHOLARSHIP_DATA.md` first: it defines the file format, the rule syntax and the pipeline.

## Modes

- **`find <topic>`** — e.g. `find women-only master's in Europe`, `find KP need-based undergraduate`.
  Search, shortlist programmes that are open to Pakistani citizens and still running, verify each on its
  official page, then add the ones the user approves (ask before writing files when there are more than five).
- **`add <name or url>`** — add one specific programme.
- **`update <slug>`** — re-check one listing against its sources and update the file.
- **`review-due`** — run `python manage.py due_for_review`, then do `update` for every listing it prints.

## Non-negotiable research rules

1. **Official sources decide.** The provider's own site, a government or university page. News sites and
   aggregators (scholars4dev, studyabroad.pk, opportunity blogs) may point you somewhere, never settle a fact.
   If only a news report is reachable, say so in the source note and in the report.
2. **Never invent.** No programme, amount, date, age limit or score that a source does not state.
3. **Only stated criteria become rules.** Anything soft ("preference for under-30s", "strong academics") goes in
   `who_for_*`, not in `requirements`. A rule that wrongly fails a girl is the worst bug HerPath can have.
4. **Pakistan must be eligible now.** Check the current cycle's country list. Conflicting sources: leave it out and report it.
5. **Dates:** set `deadline` only when officially announced for the coming cycle; otherwise `null` with
   `status: "expected"` and `usual_opening_month`. Past deadline: `status: "closed"`, keep the date.
6. **Record every source** in `sources`: `{"url", "checked": "YYYY-MM-DD", "note": "which facts it confirmed"}`.
   Append; don't delete old entries. The latest note becomes the public change-log entry.
7. **Bilingual:** every `_en` text needs a plain, warm Urdu `_ur` equivalent (Naskh script, no Roman Urdu).
   Rule messages are `{"en": ..., "ur": ...}`.
8. **Set `last_verified`** to today only if you actually checked the official page today. Set `next_check` to the
   15th of the month before it usually opens (or ~3 months ahead if unknown).

## Workflow

1. Research with WebSearch, then WebFetch the official pages. If a page times out, try its PDF/DOCX or the
   provider's news page, and note what you could not reach.
2. New listing: `python manage.py scaffold_scholarship <slug>` (slug = lowercase-hyphenated, stable forever),
   then fill every field. Existing listing: edit `backend/data/scholarships/<slug>.json` in place.
3. Rules: copy the patterns from existing files (`fulbright-masters.json` for anyOf English tests,
   `turkiye-burslari.json` for `appliesWhen` on `targetLevel`). `fixGuide` must name a guide in
   `backend/data/guides/`, and `daysNeeded` must equal that guide's `days_needed`.
4. Validate and preview:
   - Docker: `docker compose exec backend python manage.py seed --dry-run`
   - Local: `cd backend && python manage.py seed --dry-run`
   Fix anything it rejects. Then run the data tests: `docker compose exec backend pytest -q scholarships`
   (`test_seed.py` counts listings — update the expected number when you add some).
5. Sanity-check matching for one or two realistic profiles (see "Checking a listing" in the doc).
6. Write the report `docs/scholarship-research/YYYY-MM-DD-<topic>.md` using the template below.
7. Tell the user what you added or changed, what you could not verify, and the next command to run.
   Do not run `seed` without `--dry-run`, commit, or push unless the user asks.

## Report template

```markdown
# <Topic> — <YYYY-MM-DD>

Asked for: <the user's request>

## Added / updated
| Listing | What changed | Official source | Confidence |
|---|---|---|---|
| slug | e.g. new; deadline set to 2027-03-31 | url | High / Medium (why) |

## Considered and left out
- <Programme>: <reason, e.g. Pakistan not on the 2027 country list>

## Could not verify
- <fact>: <what was tried>

## Next check
- slug: YYYY-MM-DD
```
