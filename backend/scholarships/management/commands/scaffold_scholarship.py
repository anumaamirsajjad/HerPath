import datetime as dt
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from scholarships import datafiles as df

EXAMPLE_RULES = [
    {"field": "domicile", "rule": "in", "value": ["Punjab"], "fixable": False,
     "message": {"en": "Only for students with Punjab domicile", "ur": "صرف پنجاب ڈومیسائل والی طالبات کے لیے"}},
    {"field": "documents.incomeCertificate", "rule": "has", "fixable": True, "fixGuide": "income-certificate", "daysNeeded": 14,
     "message": {"en": "Income certificate", "ur": "آمدنی سرٹیفکیٹ"}},
]


class Command(BaseCommand):
    help = "Create backend/data/scholarships/<slug>.json from a template (unpublished until you set is_published)."

    def add_arguments(self, parser):
        parser.add_argument("slug", help="Lowercase words joined by hyphens, e.g. punjab-merit-award")
        parser.add_argument("--data-dir", default=str(df.DATA))

    def handle(self, *args, **o):
        slug = o["slug"]
        if not slug.replace("-", "").isalnum() or slug != slug.lower():
            raise CommandError("Use lowercase letters, numbers and hyphens only.")
        path = Path(o["data_dir"]) / "scholarships" / f"{slug}.json"
        if path.exists():
            raise CommandError(f"{path} already exists.")
        today = dt.date.today()
        values = {
            "slug": slug, "provider": "TODO organisation", "location": "pakistan", "country": "Pakistan",
            "name_en": "TODO name", "name_ur": "", "summary_en": "TODO one or two sentences", "summary_ur": "",
            "coverage_en": "TODO what it pays for, with PKR amounts", "coverage_ur": "",
            "who_for_en": "TODO eligibility in plain words", "who_for_ur": "",
            "application_steps_en": "1. TODO first step.\n2. TODO second step.", "application_steps_ur": "",
            "family_summary_en": "TODO who runs it, that applying is free, what it pays, where she would study", "family_summary_ur": "",
            "levels": ["undergraduate"], "types": ["need"], "covers": ["tuition"], "funding": "partial",
            "women_only": False, "female_quota": False, "allows_other_scholarship": False, "university_type": "any",
            "provinces": [], "income_limit": None, "test_requirement": "none", "special_categories": [],
            "required_documents": ["cnic", "incomeCertificate"], "requirements": EXAMPLE_RULES,
            "usual_opening_month": None, "status": "expected", "deadline": None, "official_link": "https://example.org",
            "last_verified": today.isoformat(), "next_check": (today + dt.timedelta(days=90)).isoformat(), "is_published": False,
        }
        sources = [{"url": "https://example.org", "checked": today.isoformat(), "note": "TODO where each fact came from"}]
        df.write_scholarship(path, {k: values.get(k) for k in df.SCHOLARSHIP_FIELDS}, sources)
        self.stdout.write(f"Created {path}. Fill in every TODO, set is_published to true, then run `python manage.py seed --dry-run`.")
