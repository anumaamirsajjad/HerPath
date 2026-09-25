import datetime as dt

import pytest
from django.contrib.auth import get_user_model
from html.parser import HTMLParser

from django.test import Client

from scholarships.models import ChangeLog, ProblemReport, Scholarship

from .factories import make_scholarship

pytestmark = pytest.mark.django_db


@pytest.fixture
def staff():
    c = Client()
    c.force_login(get_user_model().objects.create_superuser(email="admin@x.com", password="pass12345"))
    return c


class _FormFields(HTMLParser):
    """Collects the values a browser would submit from the admin change form."""

    def __init__(self):
        super().__init__()
        self.data, self._select, self._textarea = {}, None, None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        name = a.get("name")
        if tag == "input" and name and a.get("type") not in ("submit", "button", "file"):
            if a.get("type") in ("checkbox", "radio"):
                if "checked" in a:
                    self.data[name] = a.get("value", "on")
            else:
                self.data[name] = a.get("value", "")
        elif tag == "select" and name:
            self._select = name
            self.data.setdefault(name, "")
        elif tag == "option" and self._select and "selected" in a:
            self.data[self._select] = a.get("value", "")
        elif tag == "textarea" and name:
            self._textarea = name
            self.data[name] = ""

    def handle_endtag(self, tag):
        if tag == "select":
            self._select = None
        elif tag == "textarea":
            self._textarea = None

    def handle_data(self, text):
        if self._textarea:
            self.data[self._textarea] += text


def _submit(staff, s, **over):
    url = f"/admin/scholarships/scholarship/{s.pk}/change/"
    p = _FormFields()
    p.feed(staff.get(url).content.decode())
    data = {k: v for k, v in p.data.items() if not k.startswith("changes-__prefix__")}
    data["requirements"] = data["requirements"].lstrip("\n")  # browsers drop the textarea's leading newline
    data.update(over)
    return staff.post(url, {**data, "_save": "Save"})


def test_admin_edit_writes_change_log(staff):
    s = make_scholarship(slug="a", status="expected")
    r = _submit(staff, s, status="open", deadline="2026-12-01")
    assert r.status_code == 302
    log = ChangeLog.objects.get(scholarship=s)
    assert "status" in log.note and "deadline" in log.note and log.source == s.official_link


def test_admin_save_without_changes_writes_nothing(staff):
    s = make_scholarship(slug="a")
    assert _submit(staff, s).status_code == 302
    assert ChangeLog.objects.count() == 0


def test_due_for_verification_filter(staff):
    make_scholarship(slug="due", next_check=dt.date.today() - dt.timedelta(days=1))
    make_scholarship(slug="later", next_check=dt.date.today() + dt.timedelta(days=30))
    r = staff.get("/admin/scholarships/scholarship/?verification=due")
    names = [s.slug for s in r.context["cl"].result_list]
    assert names == ["due"]


def test_problem_reports_can_be_resolved(staff):
    ProblemReport.objects.create(message="x")
    r = staff.get("/admin/scholarships/problemreport/?resolved__exact=0")
    assert r.status_code == 200 and len(r.context["cl"].result_list) == 1
    assert ProblemReport._meta.get_field("resolved").default is False
