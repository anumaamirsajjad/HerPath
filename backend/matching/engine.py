"""Pure rule engine. No Django imports."""
import operator
from datetime import timedelta

STATUS_ORDER = ["met", "fixable", "fixable_later", "not_eligible"]
OPS = {
    "==": operator.eq,
    "!=": operator.ne,
    ">=": operator.ge,
    "<=": operator.le,
    "in": lambda v, allowed: v in allowed,
    "has": lambda v, _: bool(v),
    "contains": lambda v, x: isinstance(v, (list, tuple, str)) and x in v,
}


def get_path(data, dotted):
    cur = data
    for part in dotted.split("."):
        if not isinstance(cur, dict):
            return None
        cur = cur.get(part)
    return cur


def _passes(node, profile):
    """Returns (passed, missing)."""
    value = get_path(profile, node["field"])
    if value is None:
        return False, True
    try:
        return bool(OPS[node["rule"]](value, node.get("value"))), False
    except TypeError:
        return False, False


def _worst(results):
    return max(results, key=lambda r: STATUS_ORDER.index(r["status"]))["status"]


def _best(results):
    return min(results, key=lambda r: STATUS_ORDER.index(r["status"]))["status"]


def _eval_leaf(node, profile, deadline, today):
    passed, missing = _passes(node, profile)
    days = node.get("daysNeeded")
    start_by = deadline - timedelta(days=days) if deadline and node.get("fixable") and days else None
    if passed:
        status = "met"
    elif not node.get("fixable"):
        status = "not_eligible"
    elif start_by and start_by < today:
        status = "fixable_later"
    else:
        status = "fixable"
    return {
        "kind": "leaf", "status": status, "field": node["field"], "message": node.get("message", {}),
        "fixGuide": node.get("fixGuide"), "daysNeeded": days,
        "startBy": start_by.isoformat() if start_by and not passed else None,
        "missingFromProfile": missing,
    }


def _eval_node(node, profile, deadline, today):
    cond = node.get("appliesWhen")
    if cond and not _passes(cond, profile)[0]:
        return None
    if "anyOf" in node or "allOf" in node:
        kind = "anyOf" if "anyOf" in node else "allOf"
        children = [c for c in (_eval_node(n, profile, deadline, today) for n in node[kind]) if c]
        if kind == "anyOf":
            met = any(c["status"] == "met" for c in children)
            if not met:
                children.sort(key=lambda c: (c.get("daysNeeded") is None, c.get("daysNeeded") or 0))
            status = "met" if met else _best(children)
        else:
            status = _worst(children)
        return {"kind": kind, "status": status, "message": node.get("message", {}), "options": children}
    return _eval_leaf(node, profile, deadline, today)


def evaluate(requirements, profile, deadline, today):
    results = [r for r in (_eval_node(n, profile or {}, deadline, today) for n in requirements) if r]
    total = len(results)
    met = sum(r["status"] == "met" for r in results)
    worst = _worst(results) if results else "met"
    tab = {"met": "apply_now", "fixable": "almost", "fixable_later": "future", "not_eligible": "not_eligible"}[worst]
    score = None if tab == "not_eligible" else (round(100 * met / total) if total else 100)
    return {"requirements": results, "met_count": met, "total_count": total, "tab": tab, "score": score}


def unmet_document_fields(result):
    out = set()
    for r in result["requirements"] if "requirements" in result else [result]:
        if r["kind"] == "leaf":
            if r["status"] != "met" and r["field"].startswith("documents."):
                out.add(r["field"].split(".", 1)[1])
        else:
            for o in r["options"]:
                out |= unmet_document_fields(o)
    return out


def unlocks(profile, scholarships, today):
    have = (profile or {}).get("documents") or {}
    counts = {}
    for s in scholarships:
        res = evaluate(s["requirements"], profile, s["deadline"], today)
        if res["tab"] == "not_eligible":
            continue
        for key in unmet_document_fields(res):
            if not have.get(key):
                counts[key] = counts.get(key, 0) + 1
    return counts


def conflicts(saved):
    out = []
    for i, a in enumerate(saved):
        for b in saved[i + 1:]:
            if not (a["allows_other_scholarship"] and b["allows_other_scholarship"]):
                out.append([a["slug"], b["slug"]])
    return out


def _validate_leaf(n, path, errs, require_message=True):
    if not isinstance(n.get("field"), str):
        errs.append(f"{path}: field must be a string")
    if n.get("rule") not in OPS:
        errs.append(f"{path}: rule must be one of {sorted(OPS)}")
    if n.get("rule") != "has" and "value" not in n:
        errs.append(f"{path}: value is required for rule {n.get('rule')}")
    if require_message and (not isinstance(n.get("message"), dict) or "en" not in n["message"]):
        errs.append(f"{path}: message must be an object with an 'en' key")
    if require_message:
        if not isinstance(n.get("fixable"), bool):
            errs.append(f"{path}: fixable must be true or false")
        if n.get("fixable"):
            if not isinstance(n.get("daysNeeded"), int):
                errs.append(f"{path}: fixable rules need integer daysNeeded")
            if not isinstance(n.get("fixGuide"), str):
                errs.append(f"{path}: fixable rules need a fixGuide slug")


def _validate_node(n, path, errs):
    if not isinstance(n, dict):
        errs.append(f"{path}: must be an object")
        return
    if "appliesWhen" in n:
        _validate_leaf(n["appliesWhen"], f"{path}.appliesWhen", errs, require_message=False)
    kind = "anyOf" if "anyOf" in n else "allOf" if "allOf" in n else None
    if kind:
        if not isinstance(n[kind], list) or not n[kind]:
            errs.append(f"{path}.{kind}: must be a non-empty list")
        else:
            for i, c in enumerate(n[kind]):
                _validate_node(c, f"{path}.{kind}[{i}]", errs)
        if not isinstance(n.get("message"), dict) or "en" not in n["message"]:
            errs.append(f"{path}: message must be an object with an 'en' key")
    else:
        _validate_leaf(n, path, errs)


def validate_requirements(rules):
    if not isinstance(rules, list):
        return ["requirements must be a list"]
    errs = []
    for i, n in enumerate(rules):
        _validate_node(n, f"requirements[{i}]", errs)
    return errs
