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
    make_scholarship(slug="ready", requirements=[doc("cnic")])
    make_scholarship(slug="almost", requirements=[doc("passport")])
    make_scholarship(slug="never", requirements=[{"field": "domicile", "rule": "in", "value": ["Sindh"], "fixable": False, "message": MSG}])
    make_scholarship(slug="hidden", is_published=False)


def test_match_without_profile(client, data):
    r = client.get("/api/match")
    assert r.status_code == 200
    assert r.data["has_profile"] is False
    assert all(v == [] for v in r.data["tabs"].values())


def test_match_groups_by_tab(client, data):
    client.put("/api/profile", {"data": {"domicile": "Punjab", "documents": {"cnic": True}}}, format="json")
    r = client.get("/api/match")
    tabs = r.data["tabs"]
    assert [s["slug"] for s in tabs["apply_now"]] == ["ready"]
    assert [s["slug"] for s in tabs["almost"]] == ["almost"]
    assert tabs["future"] == []
    assert [s["slug"] for s in tabs["not_eligible"]] == ["never"]
    assert tabs["almost"][0]["score"] == 0 and tabs["almost"][0]["gap_count"] == 1
    assert tabs["not_eligible"][0]["score"] is None
    assert "name" in tabs["ready"][0] and "deadline" in tabs["ready"][0]


def test_match_detail(client, data):
    client.put("/api/profile", {"data": {"documents": {}}}, format="json")
    r = client.get("/api/match/almost")
    assert r.data["tab"] == "almost"
    assert r.data["requirements"][0]["field"] == "documents.passport"
    assert client.get("/api/match/hidden").status_code == 404


def test_match_detail_without_profile(client, data):
    r = client.get("/api/match/almost")
    assert r.status_code == 200 and r.data["has_profile"] is False


def test_unlocks(client, data):
    client.put("/api/profile", {"data": {"domicile": "Punjab", "documents": {"cnic": True}}}, format="json")
    assert client.get("/api/match/unlocks").data == {"unlocks": {"passport": 1}}


def test_match_requires_auth(data):
    assert APIClient().get("/api/match").status_code == 401
