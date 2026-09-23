import datetime as dt

from matching.engine import evaluate, get_path

TODAY = dt.date(2026, 9, 23)
MSG = {"en": "m", "ur": "م"}


def leaf(field, rule, value=None, fixable=False, days=None, guide=None, **extra):
    n = {"field": field, "rule": rule, "fixable": fixable, "message": MSG, **extra}
    if value is not None:
        n["value"] = value
    if fixable:
        n["daysNeeded"] = days or 14
        n["fixGuide"] = guide or "g"
    return n


def statuses(res):
    return [r["status"] for r in res["requirements"]]


def test_get_path():
    assert get_path({"tests": {"ielts": 6.5}}, "tests.ielts") == 6.5
    assert get_path({"tests": {}}, "tests.ielts") is None
    assert get_path({}, "a.b.c") is None


def test_operators():
    p = {"age": 20, "domicile": "Punjab", "fields": ["cs"], "documents": {"cnic": True, "passport": False}}
    assert statuses(evaluate([leaf("age", "<=", 25)], p, None, TODAY)) == ["met"]
    assert statuses(evaluate([leaf("age", ">=", 25)], p, None, TODAY)) == ["not_eligible"]
    assert statuses(evaluate([leaf("age", "==", 20)], p, None, TODAY)) == ["met"]
    assert statuses(evaluate([leaf("age", "!=", 20)], p, None, TODAY)) == ["not_eligible"]
    assert statuses(evaluate([leaf("domicile", "in", ["Punjab", "Sindh"])], p, None, TODAY)) == ["met"]
    assert statuses(evaluate([leaf("fields", "contains", "cs")], p, None, TODAY)) == ["met"]
    assert statuses(evaluate([leaf("documents.cnic", "has")], p, None, TODAY)) == ["met"]
    assert statuses(evaluate([leaf("documents.passport", "has", fixable=True)], p, None, TODAY)) == ["fixable"]


def test_missing_value_is_unmet_not_crash():
    res = evaluate([leaf("tests.ielts", ">=", 6.5, fixable=True)], {"tests": {}}, None, TODAY)
    r = res["requirements"][0]
    assert r["status"] == "fixable" and r["missingFromProfile"] is True
    res = evaluate([leaf("age", "<=", 30)], {}, None, TODAY)
    assert res["requirements"][0]["status"] == "not_eligible"


def test_type_mismatch_is_unmet_not_crash():
    res = evaluate([leaf("age", "<=", 30)], {"age": "twenty"}, None, TODAY)
    assert res["requirements"][0]["status"] == "not_eligible"


def test_applies_when_skips_node():
    rule = leaf("age", "<=", 35, appliesWhen={"field": "level", "rule": "==", "value": "masters"})
    res = evaluate([rule], {"age": 40, "level": "bachelors"}, None, TODAY)
    assert res["requirements"] == [] and res["total_count"] == 0 and res["tab"] == "apply_now" and res["score"] == 100
    res = evaluate([rule], {"age": 40, "level": "masters"}, None, TODAY)
    assert res["tab"] == "not_eligible" and res["score"] is None


def test_all_of_takes_worst():
    g = {"allOf": [leaf("age", "<=", 30), leaf("documents.passport", "has", fixable=True)], "message": MSG}
    res = evaluate([g], {"age": 20, "documents": {}}, None, TODAY)
    assert res["requirements"][0]["status"] == "fixable"
    res = evaluate([g], {"age": 40, "documents": {}}, None, TODAY)
    assert res["requirements"][0]["status"] == "not_eligible"


def test_any_of_met_if_any_child_met():
    g = {"anyOf": [leaf("tests.ielts", ">=", 6.5, fixable=True, days=60), leaf("tests.toefl", ">=", 80, fixable=True, days=60)], "message": MSG}
    res = evaluate([g], {"tests": {"toefl": 90}}, None, TODAY)
    assert res["requirements"][0]["status"] == "met" and res["met_count"] == 1 and res["total_count"] == 1


def test_any_of_unmet_takes_best_and_orders_fastest_first():
    g = {"anyOf": [
        leaf("tests.ielts", ">=", 6.5, fixable=True, days=60, guide="ielts"),
        leaf("documents.englishMediumLetter", "has", fixable=True, days=10, guide="letter"),
        leaf("nationality", "==", "UK"),              # not fixable, fails
    ], "message": MSG}
    res = evaluate([g], {"tests": {}, "documents": {}}, None, TODAY)
    r = res["requirements"][0]
    assert r["status"] == "fixable"
    assert [o["fixGuide"] for o in r["options"][:2]] == ["letter", "ielts"]
    assert r["options"][-1]["status"] == "not_eligible"


def test_start_by_and_fixable_later():
    deadline = dt.date(2026, 10, 15)
    fast = leaf("documents.passport", "has", fixable=True, days=10)
    slow = leaf("tests.ielts", ">=", 6.5, fixable=True, days=60)
    res = evaluate([fast, slow], {"documents": {}, "tests": {}}, deadline, TODAY)
    a, b = res["requirements"]
    assert a["status"] == "fixable" and a["startBy"] == "2026-10-05"
    assert b["status"] == "fixable_later" and b["startBy"] == "2026-08-16"
    assert res["tab"] == "future"


def test_past_deadline_makes_every_gap_fixable_later():
    res = evaluate([leaf("documents.passport", "has", fixable=True, days=1)], {"documents": {}}, dt.date(2026, 1, 1), TODAY)
    assert res["requirements"][0]["status"] == "fixable_later" and res["tab"] == "future"


def test_no_deadline_keeps_fixable_with_null_start_by():
    res = evaluate([leaf("documents.passport", "has", fixable=True, days=365)], {"documents": {}}, None, TODAY)
    assert res["requirements"][0]["status"] == "fixable" and res["requirements"][0]["startBy"] is None
    assert res["tab"] == "almost"


def test_tab_and_score():
    rules = [leaf("age", "<=", 30), leaf("documents.passport", "has", fixable=True), leaf("documents.cnic", "has", fixable=True)]
    res = evaluate(rules, {"age": 20, "documents": {"cnic": True}}, None, TODAY)
    assert res["tab"] == "almost" and res["met_count"] == 2 and res["total_count"] == 3 and res["score"] == 67
    res = evaluate(rules, {"age": 20, "documents": {"cnic": True, "passport": True}}, None, TODAY)
    assert res["tab"] == "apply_now" and res["score"] == 100
    res = evaluate(rules, {"age": 40, "documents": {}}, None, TODAY)
    assert res["tab"] == "not_eligible" and res["score"] is None
