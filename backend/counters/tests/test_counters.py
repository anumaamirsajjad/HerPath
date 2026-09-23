import pytest
from rest_framework.test import APIClient

from counters.models import Counter
from scholarships.tests.factories import make_scholarship

pytestmark = pytest.mark.django_db
MSG = {"en": "m"}


def doc(key):
    return {"field": f"documents.{key}", "rule": "has", "fixable": True, "fixGuide": key, "daysNeeded": 10, "message": MSG}


def count(key):
    c = Counter.objects.filter(key=key).first()
    return c.count if c else 0


@pytest.fixture
def client():
    c = APIClient()
    r = c.post("/api/auth/signup", {"email": "a@x.com", "password": "pass12345"}, format="json")
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
    return c


def test_profile_create_and_gap_close_counters(client):
    make_scholarship(slug="a", requirements=[doc("passport")])
    make_scholarship(slug="b", requirements=[doc("passport"), doc("cnic")])
    client.put("/api/profile", {"data": {"documents": {}}}, format="json")
    assert count("profiles_created") == 1 and count("gaps_closed") == 0
    client.put("/api/profile", {"data": {"documents": {"passport": True}}}, format="json")
    assert count("profiles_created") == 1
    assert count("gaps_closed") == 2            # passport gap closed in a and b
    assert count("moved_to_apply_now") == 1     # only a is fully met


def test_opt_out_skips_counters(client):
    make_scholarship(slug="a", requirements=[doc("passport")])
    client.put("/api/profile", {"data": {"documents": {}}}, format="json")
    client.patch("/api/profile", {"analytics_opt_out": True}, format="json")
    client.put("/api/profile", {"data": {"documents": {"passport": True}}}, format="json")
    assert count("gaps_closed") == 0


def test_public_counter_endpoints():
    c = APIClient()
    assert c.post("/api/counters/family_shared").status_code == 204
    assert c.post("/api/counters/family_shared").status_code == 204
    assert c.post("/api/counters/profiles_created").status_code == 400
    r = c.get("/api/counters")
    assert r.status_code == 200
    assert r.data == {"profiles_created": 0, "gaps_closed": 0, "moved_to_apply_now": 0, "family_shared": 2}
