import pytest
from rest_framework.test import APIClient

from scholarships.tests.factories import make_scholarship

pytestmark = pytest.mark.django_db
MSG = {"en": "m"}


def doc(key, days=10):
    return {"field": f"documents.{key}", "rule": "has", "fixable": True, "fixGuide": key, "daysNeeded": days, "message": MSG}


@pytest.fixture
def client():
    c = APIClient()
    r = c.post("/api/auth/signup", {"email": "a@x.com", "password": "pass12345"}, format="json")
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
    return c


@pytest.fixture
def data():
    make_scholarship(slug="ready", status="open", requirements=[doc("cnic")])
    make_scholarship(slug="almost", status="open", requirements=[doc("passport")])
    make_scholarship(slug="never", status="open", requirements=[{"field": "domicile", "rule": "in", "value": ["Sindh"], "fixable": False, "message": MSG}])
    make_scholarship(slug="hidden", is_published=False)


def test_match_without_profile(client, data):
    r = client.get("/api/match")
    assert r.status_code == 200
    assert r.data["has_profile"] is False
    assert all(v == [] for v in r.data["tabs"].values())


def test_match_groups_by_tab(client, data):
    client.put("/api/profile", {"data": {"targetLevel": "undergraduate", "domicile": "Punjab", "documents": {"cnic": True}}}, format="json")
    r = client.get("/api/match")
    tabs = r.data["tabs"]
    assert [s["slug"] for s in tabs["apply_now"]] == ["ready"]
    assert [s["slug"] for s in tabs["almost"]] == ["almost"]
    assert tabs["future"] == []
    assert [s["slug"] for s in tabs["not_eligible"]] == ["never"]
    assert tabs["almost"][0]["score"] == 50 and tabs["almost"][0]["gap_count"] == 1  # level check met, passport missing
    assert tabs["not_eligible"][0]["score"] is None
    assert "name" in tabs["apply_now"][0] and "deadline" in tabs["apply_now"][0]


def test_match_detail(client, data):
    client.put("/api/profile", {"data": {"targetLevel": "undergraduate", "documents": {}}}, format="json")
    r = client.get("/api/match/almost")
    assert r.data["tab"] == "almost"
    assert [x["field"] for x in r.data["requirements"]] == ["targetLevel", "documents.passport"]
    assert client.get("/api/match/hidden").status_code == 404


def test_match_detail_without_profile(client, data):
    r = client.get("/api/match/almost")
    assert r.status_code == 200 and r.data["has_profile"] is False


def test_unlocks(client, data):
    client.put("/api/profile", {"data": {"targetLevel": "undergraduate", "domicile": "Punjab", "documents": {"cnic": True}}}, format="json")
    assert client.get("/api/match/unlocks").data == {"unlocks": {"passport": 1}}


def test_match_requires_auth(data):
    assert APIClient().get("/api/match").status_code == 401


def test_match_rows_carry_missing_count_and_needs_info(client):
    make_scholarship(slug="q", requirements=[{"field": "interPercent", "rule": ">=", "value": 60, "fixable": False, "message": MSG}])
    client.put("/api/profile", {"data": {"targetLevel": "undergraduate", "documents": {}}}, format="json")
    row = client.get("/api/match").data["tabs"]["not_eligible"][0]
    assert row["missing_count"] == 1 and row["needs_info"] is True


def test_match_rows_carry_cycle_fields(client, data):
    client.put("/api/profile", {"data": {"targetLevel": "undergraduate", "documents": {"cnic": True}}}, format="json")
    row = client.get("/api/match").data["tabs"]["apply_now"][0]
    assert "effective_deadline" in row and "deadline_estimated" in row and "ready" in client.get("/api/match").data["tabs"]
