import datetime as dt

from matching.services import evaluate_all

from .models import increment


def _met_leaves(result):
    """Set of leaf fields with status met, recursively."""
    out = set()
    for r in result["requirements"] if "requirements" in result else [result]:
        if r["kind"] == "leaf":
            if r["status"] == "met":
                out.add(r["field"])
        else:
            for o in r["options"]:
                out |= _met_leaves(o)
    return out


def record_profile_change(user, old_data, new_data):
    if user.profile.analytics_opt_out:
        return
    if old_data is None:
        increment("profiles_created")
        return
    today = dt.date.today()
    before, after = evaluate_all(old_data, today), evaluate_all(new_data, today)
    gaps, moved = 0, 0
    for slug, new in after.items():
        old = before.get(slug)
        if not old:
            continue
        gaps += len(_met_leaves(new) - _met_leaves(old))
        if old["tab"] in ("almost", "future") and new["tab"] == "apply_now":
            moved += 1
    increment("gaps_closed", gaps)
    increment("moved_to_apply_now", moved)
