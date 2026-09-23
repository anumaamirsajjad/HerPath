import pytest
from django.core import mail
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


@pytest.fixture
def client():
    return APIClient()


def test_signup_returns_tokens(client):
    r = client.post("/api/auth/signup", {"email": "a@x.com", "password": "pass12345"}, format="json")
    assert r.status_code == 201
    assert set(r.data) == {"access", "refresh"}


def test_signup_rejects_duplicate_email_case_insensitive(client):
    client.post("/api/auth/signup", {"email": "a@x.com", "password": "pass12345"}, format="json")
    r = client.post("/api/auth/signup", {"email": "A@X.com", "password": "pass12345"}, format="json")
    assert r.status_code == 400
    assert "email" in r.data


def test_login_and_me(client):
    client.post("/api/auth/signup", {"email": "a@x.com", "password": "pass12345"}, format="json")
    r = client.post("/api/auth/login", {"email": "a@x.com", "password": "pass12345"}, format="json")
    assert r.status_code == 200
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.data == {"id": me.data["id"], "email": "a@x.com", "has_profile": False}


def test_me_requires_auth(client):
    assert client.get("/api/auth/me").status_code == 401


def test_delete_me(client):
    r = client.post("/api/auth/signup", {"email": "a@x.com", "password": "pass12345"}, format="json")
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
    assert client.delete("/api/auth/me").status_code == 204
    assert client.get("/api/auth/me").status_code == 401


def test_password_reset_flow(client, settings):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    client.post("/api/auth/signup", {"email": "a@x.com", "password": "pass12345"}, format="json")
    r = client.post("/api/auth/password-reset", {"email": "a@x.com"}, format="json")
    assert r.status_code == 200
    assert len(mail.outbox) == 1
    body = mail.outbox[0].body
    # link looks like http://localhost:3000/en/reset-password?uid=..&token=..
    query = body.split("reset-password?")[1].strip()
    uid, token = [p.split("=")[1] for p in query.split("&")]
    r = client.post("/api/auth/password-reset/confirm",
                    {"uid": uid, "token": token, "password": "newpass123"}, format="json")
    assert r.status_code == 200
    r = client.post("/api/auth/login", {"email": "a@x.com", "password": "newpass123"}, format="json")
    assert r.status_code == 200


def test_password_reset_unknown_email_still_200(client):
    r = client.post("/api/auth/password-reset", {"email": "nobody@x.com"}, format="json")
    assert r.status_code == 200
