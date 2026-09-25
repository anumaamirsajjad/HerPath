import datetime as dt

from django.core.management.base import BaseCommand

from scholarships.models import Scholarship


class Command(BaseCommand):
    help = "List scholarships whose next_check date has arrived (the monthly verification routine)."

    def add_arguments(self, parser):
        parser.add_argument("--within", type=int, default=0, help="Also include those due within this many days.")

    def handle(self, *args, **o):
        until = dt.date.today() + dt.timedelta(days=o["within"])
        due = Scholarship.objects.filter(next_check__lte=until).order_by("next_check")
        if not due:
            self.stdout.write("Nothing is due for review.")
            return
        for s in due:
            self.stdout.write(f"{s.slug:32} next check {s.next_check}  last verified {s.last_verified}  {s.official_link}")
        self.stdout.write(f"{due.count()} due. Re-check each against its official page (or run /scholarships review-due in Claude Code).")
