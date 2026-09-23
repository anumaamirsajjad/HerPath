import datetime as dt

from scholarships.models import Scholarship

DEFAULTS = dict(
    provider="Test Provider", location="pakistan", name_en="Test Scholarship",
    summary_en="s", coverage_en="c", who_for_en="w", application_steps_en="a", family_summary_en="f",
    levels=["undergraduate"], types=["need"], covers=["tuition"],
    official_link="https://example.org", last_verified=dt.date(2026, 9, 23), next_check=dt.date(2027, 1, 15),
    requirements=[],
)


def make_scholarship(**over):
    slug = over.pop("slug", "test-" + str(Scholarship.objects.count() + 1))
    return Scholarship.objects.create(slug=slug, **{**DEFAULTS, **over})
