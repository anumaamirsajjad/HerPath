import datetime as dt

import pytest
from rest_framework.test import APIClient

from scholarships.models import ChangeLog, Guide, ProblemReport

from .factories import make_scholarship

pytestmark = pytest.mark.django_db


@pytest.fixture
def client():
    return APIClient()


def test_list_is_public_and_hides_unpublished_and_rules(client):
    make_scholarship(slug="a", requirements=[{"field": "age", "rule": "<=", "value": 30, "fixable": False, "message": {"en": "x"}}])
    make_scholarship(slug="b", is_published=False)
    r = client.get("/api/scholarships")
    assert r.status_code == 200
    assert [s["slug"] for s in r.data] == ["a"]
    assert "requirements" not in r.data[0]
    assert r.data[0]["name"] == "Test Scholarship"


def test_detail_includes_rules_and_lang_fallback(client):
    make_scholarship(slug="a", name_ur="", summary_ur="خلاصہ",
                     requirements=[{"field": "age", "rule": "<=", "value": 30, "fixable": False, "message": {"en": "x", "ur": "ی"}}])
    r = client.get("/api/scholarships/a?lang=ur")
    assert r.data["name"] == "Test Scholarship"      # fallback to English
    assert r.data["summary"] == "خلاصہ"
    assert r.data["requirements"][0]["message"] == {"en": "x", "ur": "ی"}


def test_detail_404_for_unpublished(client):
    make_scholarship(slug="b", is_published=False)
    assert client.get("/api/scholarships/b").status_code == 404


def test_guides_render_markdown(client):
    Guide.objects.create(slug="passport", title_en="Passport", body_en="# Step 1\n\nGo to office.", days_needed=21)
    r = client.get("/api/guides/passport")
    assert r.data["body"].startswith("<h1>Step 1</h1>")
    assert client.get("/api/guides").data[0]["slug"] == "passport"


def test_changelog_filter(client):
    a = make_scholarship(slug="a"); b = make_scholarship(slug="b")
    ChangeLog.objects.create(scholarship=a, date=dt.date(2026, 9, 1), note="n1")
    ChangeLog.objects.create(scholarship=b, date=dt.date(2026, 9, 2), note="n2")
    assert len(client.get("/api/changelog").data) == 2
    r = client.get("/api/changelog?scholarship=a")
    assert [c["note"] for c in r.data] == ["n1"]
    assert r.data[0]["scholarship"] == "a"


def test_report_problem(client):
    a = make_scholarship(slug="a")
    r = client.post("/api/reports", {"scholarship": "a", "message": "deadline wrong"}, format="json")
    assert r.status_code == 201
    assert ProblemReport.objects.get().scholarship == a


def test_report_problem_throttled(client, settings):
    for _ in range(5):
        client.post("/api/reports", {"message": "x"}, format="json")
    assert client.post("/api/reports", {"message": "x"}, format="json").status_code == 429
