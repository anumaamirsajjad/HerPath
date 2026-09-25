import datetime as dt
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from scholarships import datafiles as df
from scholarships.models import ChangeLog, Guide, Scholarship

VERB = {"create": "created", "update": "updated", "unchanged": "unchanged", "keep_admin": "kept admin edits", "conflict": "conflicts"}


class Command(BaseCommand):
    help = "Load scholarships and guides from backend/data. Keeps admin-panel edits; see docs/SCHOLARSHIP_DATA.md."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Show what would change without writing anything.")
        parser.add_argument("--prefer", choices=["json", "admin"], help="How to resolve records changed in both the file and the admin panel.")
        parser.add_argument("--only", help="Only this scholarship or guide slug.")
        parser.add_argument("--strict", action="store_true", help="Exit with an error if any conflict is left unresolved.")
        parser.add_argument("--data-dir", default=str(df.DATA), help="Folder with scholarships/ and guides/ (default: backend/data).")

    def handle(self, *args, **o):
        data = Path(o["data_dir"])
        self.dry, self.prefer = o["dry_run"], o["prefer"]
        self.counts = {kind: {v: 0 for v in VERB} for kind in ("Scholarships", "Guides")}
        self.conflicts, self.kept = [], []
        try:
            with transaction.atomic():
                for path in sorted((data / "scholarships").glob("*.json")):
                    if o["only"] and path.stem != o["only"]:
                        continue
                    values, sources = df.read_scholarship(path)
                    self._scholarship(values, sources)
                for path in sorted((data / "guides").glob("*.en.md")):
                    slug = path.name[:-6]
                    if o["only"] and slug != o["only"]:
                        continue
                    self._guide(slug, df.read_guide(path))
        except ValueError as e:
            raise CommandError(str(e)) from e

        for kind, counts in self.counts.items():
            self.stdout.write(("Dry run. " if self.dry else "") + f"{kind}: " + ", ".join(f"{VERB[k]} {n}" for k, n in counts.items()))
        if self.kept:
            self.stdout.write(f"Admin-panel edits kept for: {', '.join(self.kept)}. Run `python manage.py export_data` to save them to backend/data.")
        if self.conflicts:
            msg = (f"Changed in both the file and the admin panel: {', '.join(self.conflicts)}. Nothing was changed for them. "
                   "Re-run with --prefer json (use the file) or --prefer admin (keep the admin edit, then export_data).")
            self.stdout.write(self.style.WARNING(msg))
            if o["strict"]:
                raise CommandError(f"{len(self.conflicts)} conflict(s): {', '.join(self.conflicts)}")

    def _say(self, action, slug, fields=()):
        self.counts["Guides" if slug.startswith("guide ") else "Scholarships"][action] += 1
        if action == "unchanged":
            return
        label = {"create": "create", "update": "update", "keep_admin": "keep admin edit for", "conflict": "CONFLICT"}[action]
        self.stdout.write(f"{'would ' if self.dry and action in ('create', 'update') else ''}{label} {slug}" + (f": {', '.join(fields)}" if fields else ""))

    def _scholarship(self, values, sources):
        slug = values["slug"]
        obj = Scholarship.objects.filter(slug=slug).first()
        db = df.scholarship_values(obj) if obj else None
        action = df.decide(values, db, obj.seed_hash if obj else "", self.prefer)
        fields = df.diff(values, db) if db else []
        if action == "keep_admin":
            self.kept.append(slug)
        if action == "conflict":
            self.conflicts.append(slug)
        self._say(action, slug, fields if action in ("update", "conflict", "keep_admin") else ())
        if self.dry:
            return
        h = df.fingerprint(values)
        latest = sources[-1] if sources else {}
        if action == "create":
            obj = Scholarship.objects.create(slug=slug, seed_hash=h, **{k: v for k, v in df.to_model_kwargs(values).items()})
            ChangeLog.objects.create(scholarship=obj, date=obj.last_verified, source=latest.get("url") or obj.official_link,
                                     note=latest.get("note") or "Initial entry. Values taken from the official page but not yet independently verified.")
        elif action == "update":
            for k, v in df.to_model_kwargs(values).items():
                setattr(obj, k, v)
            obj.seed_hash = h
            obj.save()
            note = "Updated: " + ", ".join(fields) + (f". {latest['note']}" if latest.get("note") else "")
            ChangeLog.objects.create(scholarship=obj, date=dt.date.today(), source=latest.get("url") or obj.official_link, note=note)
        elif action == "unchanged" and obj.seed_hash != h:
            Scholarship.objects.filter(pk=obj.pk).update(seed_hash=h)  # record the baseline

    def _guide(self, slug, values):
        obj = Guide.objects.filter(slug=slug).first()
        db = df.guide_values(obj) if obj else None
        action = df.decide(values, db, obj.seed_hash if obj else "", self.prefer)
        if action == "keep_admin":
            self.kept.append(f"guide {slug}")
        if action == "conflict":
            self.conflicts.append(f"guide {slug}")
        self._say(action, f"guide {slug}", df.diff(values, db) if db and action != "unchanged" else ())
        if self.dry:
            return
        h = df.fingerprint(values)
        if action in ("create", "update"):
            Guide.objects.update_or_create(slug=slug, defaults={**values, "seed_hash": h})
        elif action == "unchanged" and obj.seed_hash != h:
            Guide.objects.filter(pk=obj.pk).update(seed_hash=h)
