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


def validate_requirements(rules):  # replaced in Task 6
    return []
