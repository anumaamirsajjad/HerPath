import pytest
from django.contrib.auth import get_user_model

pytestmark = pytest.mark.django_db


def test_create_user_with_email_only():
    User = get_user_model()
    u = User.objects.create_user(email="Girl@Example.com", password="pass12345")
    assert u.email == "girl@example.com"
    assert u.check_password("pass12345")
    assert not u.is_staff


def test_create_superuser():
    User = get_user_model()
    u = User.objects.create_superuser(email="admin@example.com", password="pass12345")
    assert u.is_staff and u.is_superuser
