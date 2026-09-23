import pytest
from rest_framework.test import APIClient

from scholarships.tests.factories import make_scholarship

pytestmark = pytest.mark.django_db


@pytest.fixture
def client():
    c = APIClient()
    r = c.post("/api/auth/signup", {"email": "a@x.com", "password": "pass12345"}, format="json")
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
    return c


def test_save_list_delete_and_conflicts(client):
    make_scholarship(slug="a", allows_other_scholarship=False)
    make_scholarship(slug="b", allows_other_scholarship=True)
    assert client.post("/api/saved", {"slug": "a"}, format="json").status_code == 201
    assert client.post("/api/saved", {"slug": "a"}, format="json").status_code == 201  # idempotent
    assert client.post("/api/saved", {"slug": "b"}, format="json").status_code == 201
    r = client.get("/api/saved")
    assert [i["slug"] for i in r.data["items"]] == ["a", "b"]
    assert "saved_at" in r.data["items"][0]
    assert r.data["conflicts"] == [["a", "b"]]
    assert client.delete("/api/saved/a").status_code == 204
    assert client.get("/api/saved").data["conflicts"] == []


def test_save_unknown_slug_404(client):
    assert client.post("/api/saved", {"slug": "nope"}, format="json").status_code == 404


def test_saved_requires_auth():
    assert APIClient().get("/api/saved").status_code == 401
