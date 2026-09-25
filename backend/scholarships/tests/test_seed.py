import pytest
from django.core.management import call_command

from matching.engine import validate_requirements
from scholarships.models import ChangeLog, Guide, Scholarship

pytestmark = pytest.mark.django_db


def test_seed_is_idempotent_and_valid():
    call_command("seed")
    n = Scholarship.objects.count()
    assert n == 26
    assert Guide.objects.count() == 13
    assert ChangeLog.objects.count() == 26
    for s in Scholarship.objects.all():
        assert validate_requirements(s.requirements) == [], s.slug
        assert s.family_summary_ur, f"{s.slug} needs family_summary_ur"
    call_command("seed")
    assert Scholarship.objects.count() == n and ChangeLog.objects.count() == 26


def test_every_fix_guide_exists():
    call_command("seed")
    guides = set(Guide.objects.values_list("slug", flat=True))

    def walk(nodes):
        for n in nodes:
            if "fixGuide" in n:
                assert n["fixGuide"] in guides, n["fixGuide"]
            for k in ("anyOf", "allOf"):
                if k in n:
                    walk(n[k])

    for s in Scholarship.objects.all():
        walk(s.requirements)


def test_guide_days_match_rules():
    call_command("seed")
    days = dict(Guide.objects.values_list("slug", "days_needed"))

    def walk(nodes):
        for n in nodes:
            if "fixGuide" in n:
                assert n["daysNeeded"] == days[n["fixGuide"]], (n["fixGuide"], n["daysNeeded"])
            for k in ("anyOf", "allOf"):
                walk(n.get(k, []))

    for s in Scholarship.objects.all():
        walk(s.requirements)
