import pytest
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db

GOOD = {
    "age": 19, "domicile": "Punjab", "district": "Lahore", "categories": [],
    "board": "BISE Punjab", "matricPercent": 85, "interPercent": 78.5, "interStream": "pre-medical",
    "level": "intermediate", "yearsOfEducation": 12,
    "tests": {"ielts": None}, "monthlyIncome": 45000,
    "documents": {"cnic": True, "passport": False},
    "studyIn": "both", "preferredCountries": ["UK"], "fields": ["computer-science"],
}


@pytest.fixture
def auth_client():
    c = APIClient()
    r = c.post("/api/auth/signup", {"email": "a@x.com", "password": "pass12345"}, format="json")
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
    return c


def test_get_profile_404_before_create(auth_client):
    assert auth_client.get("/api/profile").status_code == 404


def test_put_creates_and_get_returns(auth_client):
    r = auth_client.put("/api/profile", {"data": GOOD}, format="json")
    assert r.status_code == 200, r.data
    r = auth_client.get("/api/profile")
    assert r.data["data"]["domicile"] == "Punjab"
    assert r.data["data"]["tests"]["ielts"] is None
    assert r.data["data"]["documents"]["passport"] is False
    assert r.data["analytics_opt_out"] is False
    assert auth_client.get("/api/auth/me").data["has_profile"] is True


def test_put_rejects_string_number(auth_client):
    bad = dict(GOOD, interPercent="78")
    r = auth_client.put("/api/profile", {"data": bad}, format="json")
    assert r.status_code == 400
    assert "interPercent" in str(r.data)


def test_put_rejects_unknown_enum(auth_client):
    r = auth_client.put("/api/profile", {"data": dict(GOOD, domicile="Mars")}, format="json")
    assert r.status_code == 400


def test_put_rejects_unknown_document_key(auth_client):
    r = auth_client.put("/api/profile", {"data": dict(GOOD, documents={"visa": True})}, format="json")
    assert r.status_code == 400


def test_patch_opt_out(auth_client):
    auth_client.put("/api/profile", {"data": GOOD}, format="json")
    r = auth_client.patch("/api/profile", {"analytics_opt_out": True}, format="json")
    assert r.status_code == 200 and r.data["analytics_opt_out"] is True


def test_profile_requires_auth():
    assert APIClient().get("/api/profile").status_code == 401


def test_patch_rejects_data_key(auth_client):
    auth_client.put("/api/profile", {"data": GOOD}, format="json")
    r = auth_client.patch("/api/profile", {"data": {"documents": {"passport": True}}}, format="json")
    assert r.status_code == 400
    assert auth_client.get("/api/profile").data["data"]["domicile"] == "Punjab"
