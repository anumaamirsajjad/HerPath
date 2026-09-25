import datetime as dt
import json
from pathlib import Path

from django.core.management.base import BaseCommand

from scholarships import datafiles as df
from scholarships.models import Guide, Scholarship


class Command(BaseCommand):
    help = "Write admin-panel edits back to backend/data so they can be reviewed and committed to Git."

    def add_arguments(self, parser):
        parser.add_argument("--all", action="store_true", help="Export every record, not only ones edited in the admin panel.")
        parser.add_argument("--only", help="Only this scholarship or guide slug.")
        parser.add_argument("--data-dir", default=str(df.DATA))

    def handle(self, *args, **o):
        data = Path(o["data_dir"])
        n = 0
        for s in Scholarship.objects.order_by("slug"):
            values = df.scholarship_values(s)
            if not self._wanted(o, s.slug, values, s.seed_hash):
                continue
            path = data / "scholarships" / f"{s.slug}.json"
            sources = json.loads(path.read_text(encoding="utf-8")).get("sources", []) if path.exists() else []
            sources.append({"url": s.official_link, "checked": dt.date.today().isoformat(),
                            "note": "Edited in the admin panel; see the change log for details."})
            df.write_scholarship(path, values, sources)
            Scholarship.objects.filter(pk=s.pk).update(seed_hash=df.fingerprint(values))
            self.stdout.write(f"exported {path.relative_to(data.parent) if data.parent in path.parents else path}")
            n += 1
        for g in Guide.objects.order_by("slug"):
            values = df.guide_values(g)
            if not self._wanted(o, g.slug, values, g.seed_hash):
                continue
            df.write_guide(data / "guides", g.slug, values)
            Guide.objects.filter(pk=g.pk).update(seed_hash=df.fingerprint(values))
            self.stdout.write(f"exported guide {g.slug}")
            n += 1
        self.stdout.write(f"{n} file(s) written. Review with `git diff backend/data` and commit.")

    @staticmethod
    def _wanted(o, slug, values, base):
        if o["only"] and slug != o["only"]:
            return False
        return o["all"] or o["only"] or df.fingerprint(values) != base
