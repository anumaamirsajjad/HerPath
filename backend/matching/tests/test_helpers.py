import datetime as dt

from matching.engine import conflicts, unlocks, validate_requirements

TODAY = dt.date(2026, 9, 23)
MSG = {"en": "m"}


def doc(key, days=10):
    return {"field": f"documents.{key}", "rule": "has", "fixable": True, "fixGuide": key, "daysNeeded": days, "message": MSG}


def test_unlocks_counts_each_scholarship_once_and_skips_not_eligible():
    scholarships = [
        {"slug": "a", "deadline": None, "requirements": [doc("passport"), {"anyOf": [doc("passport"), doc("cnic")], "message": MSG}]},
        {"slug": "b", "deadline": None, "requirements": [doc("passport")]},
        {"slug": "c", "deadline": None, "requirements": [doc("passport"), {"field": "age", "rule": "<=", "value": 18, "fixable": False, "message": MSG}]},
    ]
    profile = {"age": 20, "documents": {"cnic": True, "passport": False}}
    assert unlocks(profile, scholarships, TODAY) == {"passport": 2}


def test_unlocks_ignores_documents_she_has():
    scholarships = [{"slug": "a", "deadline": None, "requirements": [doc("cnic")]}]
    assert unlocks({"documents": {"cnic": True}}, scholarships, TODAY) == {}


def test_conflicts():
    saved = [{"slug": "a", "allows_other_scholarship": False}, {"slug": "b", "allows_other_scholarship": True},
             {"slug": "c", "allows_other_scholarship": True}]
    assert conflicts(saved) == [["a", "b"], ["a", "c"]]


def test_validate_ok():
    rules = [doc("passport"), {"anyOf": [doc("cnic")], "message": MSG},
             {"field": "age", "rule": "<=", "value": 30, "fixable": False, "message": MSG,
              "appliesWhen": {"field": "level", "rule": "==", "value": "masters"}}]
    assert validate_requirements(rules) == []


def test_validate_errors():
    assert validate_requirements("nope") == ["requirements must be a list"]
    errs = validate_requirements([{"field": "age", "rule": "~", "fixable": False, "message": MSG}])
    assert any("rule" in e for e in errs)
    errs = validate_requirements([{"field": "documents.x", "rule": "has", "fixable": True, "message": MSG}])
    assert any("daysNeeded" in e for e in errs) and any("fixGuide" in e for e in errs)
    errs = validate_requirements([{"field": "age", "rule": "<=", "fixable": False, "message": MSG}])
    assert any("value" in e for e in errs)
    errs = validate_requirements([{"anyOf": [], "message": MSG}])
    assert any("empty" in e for e in errs)
    errs = validate_requirements([{"field": "age", "rule": "<=", "value": 1, "fixable": False}])
    assert any("message" in e for e in errs)


def test_unlocks_ignores_documents_inside_met_group():
    scholarships = [{"slug": "a", "deadline": None, "requirements": [{"anyOf": [doc("passport"), doc("cnic")], "message": MSG}]}]
    assert unlocks({"documents": {"cnic": True}}, scholarships, TODAY) == {}


def test_validate_rejects_bool_and_negative_days():
    errs = validate_requirements([{"field": "documents.x", "rule": "has", "fixable": True, "fixGuide": "g", "daysNeeded": True, "message": MSG}])
    assert any("daysNeeded" in e for e in errs)
    errs = validate_requirements([{"field": "documents.x", "rule": "has", "fixable": True, "fixGuide": "g", "daysNeeded": -1, "message": MSG}])
    assert any("daysNeeded" in e for e in errs)
