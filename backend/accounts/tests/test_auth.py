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


def test_login_accepts_mixed_case_email(client):
    client.post("/api/auth/signup", {"email": "aisha@example.com", "password": "pass12345"}, format="json")
    r = client.post("/api/auth/login", {"email": "Aisha@Example.com", "password": "pass12345"}, format="json")
    assert r.status_code == 200


def test_password_reset_invalidates_old_refresh_token(client, settings):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    old = client.post("/api/auth/signup", {"email": "a@x.com", "password": "pass12345"}, format="json").data
    client.post("/api/auth/password-reset", {"email": "a@x.com"}, format="json")
    query = mail.outbox[0].body.split("reset-password?")[1].strip()
    uid, token = [p.split("=")[1] for p in query.split("&")]
    client.post("/api/auth/password-reset/confirm", {"uid": uid, "token": token, "password": "newpass123"}, format="json")
    r = client.post("/api/auth/refresh", {"refresh": old["refresh"]}, format="json")
    assert r.status_code == 401


def test_login_is_throttled(client):
    client.post("/api/auth/signup", {"email": "a@x.com", "password": "pass12345"}, format="json")
    codes = [client.post("/api/auth/login", {"email": "a@x.com", "password": "wrong-pass"}, format="json").status_code
             for _ in range(25)]
    assert 429 in codes


def test_logout_revokes_refresh_token(client):
    t = client.post("/api/auth/signup", {"email": "a@x.com", "password": "pass12345"}, format="json").data
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {t['access']}")
    assert client.post("/api/auth/logout", {"refresh": t["refresh"]}, format="json").status_code == 204
    client.credentials()
    assert client.post("/api/auth/refresh", {"refresh": t["refresh"]}, format="json").status_code == 401


def test_logout_with_bad_token_still_204(client):
    assert client.post("/api/auth/logout", {"refresh": "garbage"}, format="json").status_code == 204


def test_duplicate_signup_message_does_not_confirm_account(client):
    client.post("/api/auth/signup", {"email": "a@x.com", "password": "pass12345"}, format="json")
    r = client.post("/api/auth/signup", {"email": "a@x.com", "password": "pass12345"}, format="json")
    assert r.status_code == 400
    assert "already exists" not in str(r.data)


def test_reset_link_uses_requested_language(client, settings):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    client.post("/api/auth/signup", {"email": "a@x.com", "password": "pass12345"}, format="json")
    client.post("/api/auth/password-reset", {"email": "a@x.com", "lang": "ur"}, format="json")
    assert "/ur/reset-password?" in mail.outbox[0].body


def test_login_throttled_per_email_across_ips(client):
    client.post("/api/auth/signup", {"email": "a@x.com", "password": "pass12345"}, format="json")
    codes = [client.post("/api/auth/login", {"email": "a@x.com", "password": "wrong-pass"}, format="json",
                         REMOTE_ADDR=f"10.0.0.{i}").status_code for i in range(15)]
    assert 429 in codes


def test_classroom_signups_from_one_ip_not_blocked(client):
    codes = [client.post("/api/auth/signup", {"email": f"g{i}@x.com", "password": "pass12345"}, format="json").status_code
             for i in range(35)]
    assert 429 not in codes


def test_throttle_ignores_spoofed_forwarded_for():
    from rest_framework.test import APIRequestFactory
    from rest_framework.throttling import AnonRateThrottle
    t = AnonRateThrottle()
    f = APIRequestFactory()
    a = f.post("/x", HTTP_X_FORWARDED_FOR="1.1.1.1", REMOTE_ADDR="10.0.0.1")
    b = f.post("/x", HTTP_X_FORWARDED_FOR="2.2.2.2", REMOTE_ADDR="10.0.0.1")
    assert t.get_ident(a) == t.get_ident(b)


def test_signup_rejects_weak_password_all_same_char(client):
    # All same characters (e.g., "aaaaaaaa") should be rejected
    r = client.post("/api/auth/signup", {"email": "weak1@x.com", "password": "aaaaaaaa"}, format="json")
    assert r.status_code == 400, f"Password 'aaaaaaaa' should be rejected, got {r.status_code}"
    assert "password" in str(r.data).lower()


def test_signup_rejects_weak_password_sequential(client):
    # Sequential numbers (e.g., "12345678") should be rejected
    r = client.post("/api/auth/signup", {"email": "weak2@x.com", "password": "12345678"}, format="json")
    assert r.status_code == 400, f"Password '12345678' should be rejected, got {r.status_code}"
    assert "password" in str(r.data).lower()


def test_signup_rejects_weak_password_purely_numeric(client):
    # Purely numeric passwords should be rejected
    r = client.post("/api/auth/signup", {"email": "weak3@x.com", "password": "99999999"}, format="json")
    assert r.status_code == 400, f"Numeric password should be rejected, got {r.status_code}"


def test_signup_rejects_common_password(client):
    # Common passwords should be rejected (e.g., "password")
    r = client.post("/api/auth/signup", {"email": "weak4@x.com", "password": "password"}, format="json")
    assert r.status_code == 400, f"Password 'password' should be rejected as common, got {r.status_code}"


def test_signup_accepts_strong_password(client):
    # Strong passwords with mixed characters should pass
    r = client.post("/api/auth/signup", {"email": "strong@x.com", "password": "MyStrongPass123!"}, format="json")
    assert r.status_code == 201, f"Strong password should be accepted, got {r.status_code}: {r.data}"
