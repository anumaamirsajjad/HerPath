import datetime as dt

from matching.services import evaluate_all

from .models import increment

READY_TABS = ("apply_now", "ready")


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
    profile = user.profile
    if profile.analytics_opt_out:
        return
    if old_data is None:
        increment("profiles_created")
        return
    today = dt.date.today()
    before, after = evaluate_all(old_data, today), evaluate_all(new_data, today)
    closed, moved = set(), set()
    for slug, new in after.items():
        old = before.get(slug)
        if not old:
            continue
        closed |= _met_leaves(new) - _met_leaves(old)
        if old["tab"] in ("almost", "future") and new["tab"] in READY_TABS:
            moved.add(slug)
    counted = profile.counted or {}
    new_gaps = closed - set(counted.get("gaps", []))
    new_moves = moved - set(counted.get("ready", []))
    increment("gaps_closed", len(new_gaps))
    increment("moved_to_apply_now", len(new_moves))
    if new_gaps or new_moves:
        profile.counted = {"gaps": sorted(set(counted.get("gaps", [])) | new_gaps),
                           "ready": sorted(set(counted.get("ready", [])) | new_moves)}
        profile.save(update_fields=["counted"])
