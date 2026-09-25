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


def test_test_score_bounds_ielts(auth_client):
    # IELTS max is 9
    bad = dict(GOOD, tests={"ielts": 9.5})
    r = auth_client.put("/api/profile", {"data": bad}, format="json")
    assert r.status_code == 400, f"IELTS 9.5 should be rejected, got {r.status_code}"
    assert "ielts" in str(r.data).lower()


def test_test_score_bounds_gre(auth_client):
    # GRE max is 340
    bad = dict(GOOD, tests={"gre": 341})
    r = auth_client.put("/api/profile", {"data": bad}, format="json")
    assert r.status_code == 400, f"GRE 341 should be rejected, got {r.status_code}"


def test_test_score_bounds_toefl(auth_client):
    # TOEFL max is 120
    bad = dict(GOOD, tests={"toefl": 121})
    r = auth_client.put("/api/profile", {"data": bad}, format="json")
    assert r.status_code == 400, f"TOEFL 121 should be rejected, got {r.status_code}"


def test_test_score_bounds_mdcat(auth_client):
    # MDCAT max is 200
    bad = dict(GOOD, tests={"mdcat": 201})
    r = auth_client.put("/api/profile", {"data": bad}, format="json")
    assert r.status_code == 400, f"MDCAT 201 should be rejected, got {r.status_code}"


def test_test_score_negative(auth_client):
    # No negative scores
    bad = dict(GOOD, tests={"mdcat": -1})
    r = auth_client.put("/api/profile", {"data": bad}, format="json")
    assert r.status_code == 400, f"Negative MDCAT should be rejected, got {r.status_code}"


def test_test_score_at_max_boundary(auth_client):
    # Boundary: exact max should pass
    good = dict(GOOD, tests={"ielts": 9, "gre": 340, "toefl": 120, "mdcat": 200})
    r = auth_client.put("/api/profile", {"data": good}, format="json")
    assert r.status_code == 200, f"Max boundary values should be accepted, got {r.status_code}: {r.data}"


def test_monthly_income_max_bound(auth_client):
    # monthlyIncome max is 10M PKR
    bad = dict(GOOD, monthlyIncome=10000001)
    r = auth_client.put("/api/profile", {"data": bad}, format="json")
    assert r.status_code == 400, f"Income 10000001 should be rejected, got {r.status_code}"


def test_monthly_income_at_max_boundary(auth_client):
    # Boundary: exact max should pass
    good = dict(GOOD, monthlyIncome=10000000)
    r = auth_client.put("/api/profile", {"data": good}, format="json")
    assert r.status_code == 200, f"Max income should be accepted, got {r.status_code}: {r.data}"
