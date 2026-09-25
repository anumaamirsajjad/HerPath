import datetime as dt

from scholarships.models import Scholarship

from .engine import evaluate

# ponytail: one application window for every programme; add a per-scholarship field if curators need it.
APPLICATION_WINDOW_DAYS = 60
LEVEL_NAMES = {
    "undergraduate": ("undergraduate", "انڈرگریجویٹ"),
    "masters": ("Master's", "ماسٹرز"),
    "phd": ("PhD", "پی ایچ ڈی"),
}
ROW_FIELDS = ("slug", "requirements", "deadline", "status", "usual_opening_month", "levels")


def _get(s, k):
    return s[k] if isinstance(s, dict) else getattr(s, k)


def cycle(s, today):
    """(deadline, estimated, is_open) for the cycle a girl should plan for.

    A real future deadline wins. Otherwise the next cycle is estimated as the usual opening month
    plus the application window, so long gaps can be judged against a date instead of never expiring.
    """
    status, deadline, month = _get(s, "status"), _get(s, "deadline"), _get(s, "usual_opening_month")
    is_open = status == "open" and (deadline is None or deadline >= today)
    if deadline and deadline >= today:
        return deadline, False, is_open
    if not month:
        return deadline, False, is_open
    window = dt.timedelta(days=APPLICATION_WINDOW_DAYS)
    if is_open:  # open, no deadline announced: the current window
        opening = dt.date(today.year, month, 1)
        if opening > today:
            opening = dt.date(today.year - 1, month, 1)
        if opening + window >= today:
            return opening + window, True, True
    this_year = month > today.month or (month == today.month and status == "expected")
    return dt.date(today.year if this_year else today.year + 1, month, 1) + window, True, is_open


def level_rule(levels):
    en = " or ".join(LEVEL_NAMES[x][0] for x in levels)
    ur = " یا ".join(LEVEL_NAMES[x][1] for x in levels)
    return {"field": "targetLevel", "rule": "in", "value": list(levels), "fixable": False,
            "message": {"en": f"For {en} applicants", "ur": f"{ur} درخواست دہندگان کے لیے"}}


def rules_for(s):
    levels = _get(s, "levels")
    return ([level_rule(levels)] if levels else []) + list(_get(s, "requirements"))


def evaluate_scholarship(s, profile, today):
    deadline, estimated, is_open = cycle(s, today)
    res = evaluate(rules_for(s), profile, deadline, today, is_open=is_open)
    return {**res, "deadline": deadline.isoformat() if deadline else None, "deadline_estimated": estimated,
            "is_open": is_open}


def published_rows():
    return list(Scholarship.objects.published().values(*ROW_FIELDS))


def unlock_rows(today):
    """Rows shaped for engine.unlocks: level check included, effective deadline."""
    return [{"slug": r["slug"], "requirements": rules_for(r), "deadline": cycle(r, today)[0]} for r in published_rows()]


def evaluate_all(profile_data, today):
    """slug -> evaluate_scholarship() result for every published scholarship."""
    return {r["slug"]: evaluate_scholarship(r, profile_data, today) for r in published_rows()}
