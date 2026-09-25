"""The data pipeline: files in Git and edits in the admin panel must never silently overwrite each other."""
import json
import shutil
from io import StringIO
from pathlib import Path

import pytest
from django.core.management import call_command

from scholarships.models import ChangeLog, Guide, Scholarship

pytestmark = pytest.mark.django_db
REAL = Path(__file__).resolve().parents[2] / "data"


@pytest.fixture
def data(tmp_path):
    """A small copy of the real data: two scholarships and one guide."""
    (tmp_path / "scholarships").mkdir()
    (tmp_path / "guides").mkdir()
    for slug in ("peef-undergraduate", "chevening"):
        shutil.copy(REAL / "scholarships" / f"{slug}.json", tmp_path / "scholarships")
    for lang in ("en", "ur"):
        shutil.copy(REAL / "guides" / f"passport.{lang}.md", tmp_path / "guides")
    return tmp_path


def seed(data, *args):
    out = StringIO()
    call_command("seed", "--data-dir", str(data), *args, stdout=out)
    return out.getvalue()


def edit_file(data, slug, **changes):
    p = data / "scholarships" / f"{slug}.json"
    d = json.loads(p.read_text(encoding="utf-8"))
    d.update(changes)
    p.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")


def test_first_seed_creates_and_logs(data):
    out = seed(data)
    assert Scholarship.objects.count() == 2 and Guide.objects.count() == 1
    assert ChangeLog.objects.filter(scholarship__slug="peef-undergraduate").count() == 1
    assert "created 2" in out


def test_reseed_without_changes_touches_nothing(data):
    seed(data)
    out = seed(data)
    assert ChangeLog.objects.count() == 2 and "unchanged 2" in out


def test_file_change_updates_db_and_logs_fields_and_source(data):
    seed(data)
    edit_file(data, "peef-undergraduate", status="open", deadline="2027-03-31",
              sources=[{"url": "https://www.peef.org.pk/news", "checked": "2027-02-01", "note": "2027 call announced"}])
    out = seed(data)
    s = Scholarship.objects.get(slug="peef-undergraduate")
    assert s.status == "open" and str(s.deadline) == "2027-03-31"
    log = ChangeLog.objects.filter(scholarship=s).order_by("-id").first()
    assert "deadline" in log.note and "status" in log.note and "2027 call announced" in log.note
    assert log.source == "https://www.peef.org.pk/news"
    assert "updated 1" in out


def test_admin_edit_is_kept_when_file_unchanged(data):
    seed(data)
    Scholarship.objects.filter(slug="chevening").update(status="open")
    out = seed(data)
    assert Scholarship.objects.get(slug="chevening").status == "open"
    assert "kept admin edits 1" in out and "export_data" in out


def test_conflict_is_skipped_and_reported(data):
    seed(data)
    Scholarship.objects.filter(slug="chevening").update(status="open")
    edit_file(data, "chevening", status="closed")
    out = seed(data)
    assert Scholarship.objects.get(slug="chevening").status == "open"
    assert "conflicts 1" in out and "chevening" in out and "--prefer" in out


def test_conflict_prefer_json_and_prefer_admin(data):
    seed(data)
    Scholarship.objects.filter(slug="chevening").update(status="open")
    edit_file(data, "chevening", status="closed")
    seed(data, "--prefer", "admin")
    assert Scholarship.objects.get(slug="chevening").status == "open"
    seed(data, "--prefer", "json")
    assert Scholarship.objects.get(slug="chevening").status == "closed"


def test_strict_fails_on_conflict(data):
    seed(data)
    Scholarship.objects.filter(slug="chevening").update(status="open")
    edit_file(data, "chevening", status="closed")
    with pytest.raises(Exception, match="conflict"):
        seed(data, "--strict")


def test_dry_run_writes_nothing(data):
    out = seed(data, "--dry-run")
    assert Scholarship.objects.count() == 0 and "would create" in out
    seed(data)
    edit_file(data, "chevening", status="open")
    out = seed(data, "--dry-run")
    assert Scholarship.objects.get(slug="chevening").status == "expected"
    assert "would update chevening: status" in out


def test_export_writes_admin_edit_back_and_next_seed_is_quiet(data):
    seed(data)
    Scholarship.objects.filter(slug="chevening").update(status="open", deadline="2026-11-05")
    call_command("export_data", "--data-dir", str(data), stdout=StringIO())
    d = json.loads((data / "scholarships" / "chevening.json").read_text(encoding="utf-8"))
    assert d["status"] == "open" and d["deadline"] == "2026-11-05"
    assert d["slug"] == "chevening" and "sources" in d
    out = seed(data)
    assert "unchanged 2" in out


def test_unknown_keys_in_a_file_are_rejected(data):
    edit_file(data, "chevening", deadlnie="2027-01-01")
    with pytest.raises(Exception, match="deadlnie"):
        seed(data)


def test_guides_follow_the_same_rules(data):
    seed(data)
    Guide.objects.filter(slug="passport").update(days_needed=45)
    out = seed(data)
    assert Guide.objects.get(slug="passport").days_needed == 45 and "kept admin edits 1" in out
    call_command("export_data", "--data-dir", str(data), stdout=StringIO())
    assert "days_needed: 45" in (data / "guides" / "passport.en.md").read_text(encoding="utf-8")
    assert "unchanged" in seed(data)


def test_scaffold_creates_a_valid_unpublished_template(data):
    call_command("scaffold_scholarship", "new-award", "--data-dir", str(data), stdout=StringIO())
    seed(data)
    s = Scholarship.objects.get(slug="new-award")
    assert s.is_published is False


def test_due_for_review_lists_overdue(data):
    seed(data)
    Scholarship.objects.filter(slug="chevening").update(next_check="2020-01-01")
    out = StringIO()
    call_command("due_for_review", stdout=out)
    assert "chevening" in out.getvalue() and "peef-undergraduate" not in out.getvalue()


def test_admin_shows_which_records_need_exporting(data, client):
    from django.contrib.auth import get_user_model
    seed(data)
    Scholarship.objects.filter(slug="chevening").update(status="open")
    client.force_login(get_user_model().objects.create_superuser(email="a@x.com", password="pass12345"))
    html = client.get("/admin/scholarships/scholarship/").content.decode()
    assert html.count("Edited here: run export_data") == 1 and html.count("Matches data file") == 1


def test_export_keeps_the_files_key_order_so_diffs_stay_small(data):
    seed(data)
    path = data / "scholarships" / "chevening.json"
    before = list(json.loads(path.read_text(encoding="utf-8")).keys())
    Scholarship.objects.filter(slug="chevening").update(status="open")
    call_command("export_data", "--data-dir", str(data), stdout=StringIO())
    after = list(json.loads(path.read_text(encoding="utf-8")).keys())
    assert after[: len(before)] == before


def test_export_leaves_unchanged_fields_byte_for_byte(data):
    seed(data)
    path = data / "scholarships" / "chevening.json"
    before = path.read_text(encoding="utf-8")
    Scholarship.objects.filter(slug="chevening").update(status="open")
    call_command("export_data", "--data-dir", str(data), stdout=StringIO())
    after = path.read_text(encoding="utf-8")
    removed = [l for l in before.splitlines() if l not in after.splitlines()]
    assert removed == ['  "status": "expected",']
