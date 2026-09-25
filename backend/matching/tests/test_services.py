import datetime as dt

import pytest

from matching.services import cycle, evaluate_scholarship
from scholarships.tests.factories import make_scholarship

pytestmark = pytest.mark.django_db
TODAY = dt.date(2026, 9, 25)
MSG = {"en": "m"}


def test_cycle_uses_real_future_deadline():
    s = make_scholarship(status="open", deadline=dt.date(2026, 10, 30), usual_opening_month=9)
    assert cycle(s, TODAY) == (dt.date(2026, 10, 30), False, True)


def test_cycle_estimates_next_opening_plus_window_when_expected():
    s = make_scholarship(status="expected", usual_opening_month=2)
    assert cycle(s, TODAY) == (dt.date(2027, 2, 1) + dt.timedelta(days=60), True, False)
    s = make_scholarship(status="expected", usual_opening_month=11)
    assert cycle(s, TODAY) == (dt.date(2026, 11, 1) + dt.timedelta(days=60), True, False)
    s = make_scholarship(status="expected", usual_opening_month=9)  # opens this month
    assert cycle(s, TODAY) == (dt.date(2026, 9, 1) + dt.timedelta(days=60), True, False)


def test_cycle_after_past_deadline_estimates_next_cycle_and_is_closed():
    s = make_scholarship(status="open", deadline=dt.date(2026, 3, 1), usual_opening_month=1)
    assert cycle(s, TODAY) == (dt.date(2027, 1, 1) + dt.timedelta(days=60), True, False)


def test_cycle_open_without_deadline_uses_current_window():
    s = make_scholarship(status="open", usual_opening_month=9)
    assert cycle(s, TODAY) == (dt.date(2026, 9, 1) + dt.timedelta(days=60), True, True)


def test_cycle_without_month_or_deadline():
    s = make_scholarship(status="open")
    assert cycle(s, TODAY) == (None, False, True)


def test_target_level_mismatch_is_not_eligible():
    s = make_scholarship(levels=["undergraduate"], status="open")
    r = evaluate_scholarship(s, {"targetLevel": "phd"}, TODAY)
    assert r["tab"] == "not_eligible" and r["requirements"][0]["field"] == "targetLevel"
    assert evaluate_scholarship(s, {"targetLevel": "undergraduate"}, TODAY)["tab"] == "apply_now"


def test_missing_target_level_needs_info():
    s = make_scholarship(levels=["masters"], status="open")
    r = evaluate_scholarship(s, {}, TODAY)
    assert r["tab"] == "not_eligible" and r["needs_info"] is True


def test_two_year_gap_is_future_not_almost_when_no_official_deadline():
    s = make_scholarship(levels=["masters"], status="expected", usual_opening_month=2,
                         requirements=[{"field": "yearsOfEducation", "rule": ">=", "value": 16, "fixable": True,
                                        "fixGuide": "sixteen-years", "daysNeeded": 730, "message": MSG}])
    r = evaluate_scholarship(s, {"targetLevel": "masters", "yearsOfEducation": 14}, TODAY)
    assert r["tab"] == "future" and r["deadline_estimated"] is True and r["deadline"] == "2027-04-02"


def test_all_met_but_expected_is_ready():
    s = make_scholarship(levels=["undergraduate"], status="expected", usual_opening_month=2)
    assert evaluate_scholarship(s, {"targetLevel": "undergraduate"}, TODAY)["tab"] == "ready"
