import datetime as dt
import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from matching.engine import validate_requirements
from scholarships.models import ChangeLog, Guide, Scholarship

DATA = Path(__file__).resolve().parents[3] / "data"


class Command(BaseCommand):
    help = "Load scholarships and guides from backend/data (idempotent)."

    def handle(self, *args, **opts):
        for path in sorted((DATA / "scholarships").glob("*.json")):
            row = json.loads(path.read_text(encoding="utf-8"))
            errors = validate_requirements(row.get("requirements", []))
            if errors:
                raise CommandError(f"{path.name}: {errors}")
            for k in ("deadline", "last_verified", "next_check"):
                if row.get(k):
                    row[k] = dt.date.fromisoformat(row[k])
            slug = row.pop("slug")
            obj, created = Scholarship.objects.update_or_create(slug=slug, defaults=row)
            if created:
                ChangeLog.objects.create(scholarship=obj, date=obj.last_verified, source=obj.official_link,
                                         note="Initial entry. Values taken from the official page but not yet independently verified.")
            self.stdout.write(f"{'created' if created else 'updated'} {slug}")

        for path in sorted((DATA / "guides").glob("*.en.md")):
            slug = path.name[:-6]
            title_en, body_en = _split(path.read_text(encoding="utf-8"))
            ur = path.with_name(f"{slug}.ur.md")
            title_ur, body_ur = _split(ur.read_text(encoding="utf-8")) if ur.exists() else ("", "")
            days, body_en = _days(body_en)
            body_ur = _days(body_ur)[1]
            Guide.objects.update_or_create(slug=slug, defaults=dict(
                title_en=title_en, body_en=body_en, title_ur=title_ur, body_ur=body_ur, days_needed=days))
            self.stdout.write(f"guide {slug}")


def _split(text):
    """First line '# Title', rest is body."""
    first, _, rest = text.partition("\n")
    return first.lstrip("# ").strip(), rest.strip()


def _days(body):
    """Pull `days_needed: N` out of the body; default 14."""
    days, keep = 14, []
    for line in body.splitlines():
        if line.startswith("days_needed:"):
            days = int(line.split(":")[1])
        else:
            keep.append(line)
    return days, "\n".join(keep).strip()
