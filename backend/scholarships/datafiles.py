"""Reading, writing and comparing the scholarship and guide files in backend/data.

Both the files (reviewed in Git) and the admin panel can change a record. `seed_hash` stores a
fingerprint of what was last loaded from the files, so `seed` can tell which side changed:

    file changed, database not     -> update the database from the file
    database changed, file not     -> keep the admin edit (export_data writes it back to the file)
    both changed                   -> conflict: skipped until you choose with --prefer json|admin
"""
import datetime as dt
import hashlib
import json
from pathlib import Path

from matching.engine import validate_requirements

from .models import Guide, Scholarship

DATA = Path(__file__).resolve().parent.parent / "data"
META_KEYS = {"sources"}  # file-only keys: research trail, not stored on the model
SCHOLARSHIP_FIELDS = [f.name for f in Scholarship._meta.concrete_fields if f.name not in ("id", "seed_hash")]
GUIDE_FIELDS = ["title_en", "title_ur", "body_en", "body_ur", "days_needed"]
DATE_FIELDS = {"deadline", "last_verified", "next_check"}


def fingerprint(values: dict) -> str:
    return hashlib.sha256(json.dumps(values, sort_keys=True, ensure_ascii=False, default=str).encode()).hexdigest()


def diff(a: dict, b: dict) -> list[str]:
    return sorted(k for k in a if a.get(k) != b.get(k))


# ---- scholarships ---------------------------------------------------------------------------

def scholarship_values(obj) -> dict:
    """The comparable values of a Scholarship, in file form (dates as ISO strings)."""
    out = {}
    for name in SCHOLARSHIP_FIELDS:
        v = getattr(obj, name)
        out[name] = v.isoformat() if isinstance(v, dt.date) else v
    return out


def read_scholarship(path: Path) -> tuple[dict, list]:
    """(values, sources) from a JSON file. Rejects unknown keys and invalid rules."""
    raw = json.loads(path.read_text(encoding="utf-8"))
    unknown = set(raw) - set(SCHOLARSHIP_FIELDS) - META_KEYS
    if unknown:
        raise ValueError(f"{path.name}: unknown keys {sorted(unknown)}")
    missing = {"slug", "name_en", "provider", "location", "official_link", "last_verified", "next_check"} - set(raw)
    if missing:
        raise ValueError(f"{path.name}: missing keys {sorted(missing)}")
    if raw["slug"] != path.stem:
        raise ValueError(f"{path.name}: slug '{raw['slug']}' must match the file name")
    errors = validate_requirements(raw.get("requirements", []))
    if errors:
        raise ValueError(f"{path.name}: {errors}")
    defaults = scholarship_values(Scholarship())  # model defaults for keys a file leaves out
    values = {k: raw.get(k, defaults[k]) for k in SCHOLARSHIP_FIELDS}
    return values, raw.get("sources", [])


def to_model_kwargs(values: dict) -> dict:
    return {k: (dt.date.fromisoformat(v) if k in DATE_FIELDS and v else v) for k, v in values.items() if k != "slug"}


def write_scholarship(path: Path, values: dict, sources: list) -> None:
    """Write values, keeping the existing file's key order so a one-field edit is a one-line diff."""
    existing = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    order = [k for k in existing if k in values] + [k for k in SCHOLARSHIP_FIELDS if k not in existing]
    # Unchanged fields keep the file's own text: the database returns JSON keys in its own order.
    ordered = {k: existing[k] if k in existing and existing[k] == values[k] else values[k] for k in order}
    ordered["sources"] = sources
    path.write_text(json.dumps(ordered, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


# ---- guides ---------------------------------------------------------------------------------

def guide_values(obj) -> dict:
    return {k: getattr(obj, k) for k in GUIDE_FIELDS}


def _split(text: str) -> tuple[str, str]:
    first, _, rest = text.partition("\n")
    return first.lstrip("# ").strip(), rest.strip()


def _days(body: str) -> tuple[int, str]:
    days, keep = 14, []
    for line in body.splitlines():
        if line.startswith("days_needed:"):
            days = int(line.split(":")[1])
        else:
            keep.append(line)
    return days, "\n".join(keep).strip()


def read_guide(en_path: Path) -> dict:
    title_en, body_en = _split(en_path.read_text(encoding="utf-8"))
    ur = en_path.with_name(en_path.name.replace(".en.md", ".ur.md"))
    title_ur, body_ur = _split(ur.read_text(encoding="utf-8")) if ur.exists() else ("", "")
    days, body_en = _days(body_en)
    return {"title_en": title_en, "title_ur": title_ur, "body_en": body_en, "body_ur": _days(body_ur)[1], "days_needed": days}


def write_guide(folder: Path, slug: str, v: dict) -> None:
    (folder / f"{slug}.en.md").write_text(f"# {v['title_en']}\n\ndays_needed: {v['days_needed']}\n\n{v['body_en']}\n", encoding="utf-8")
    if v["title_ur"] or v["body_ur"]:
        (folder / f"{slug}.ur.md").write_text(f"# {v['title_ur']}\n\n{v['body_ur']}\n", encoding="utf-8")


# ---- the three-way decision -----------------------------------------------------------------

def decide(file_values: dict, db_values: dict | None, base: str, prefer: str | None) -> str:
    """One of: create, unchanged, update, keep_admin, conflict."""
    if db_values is None:
        return "create"
    file_h, db_h = fingerprint(file_values), fingerprint(db_values)
    if file_h == db_h:
        return "unchanged"
    # No baseline yet (records loaded before seed_hash existed): the file wins, as seed always did.
    db_edited = bool(base) and db_h != base
    file_changed = not base or file_h != base
    if not db_edited:
        return "update"
    if not file_changed:
        return "keep_admin"
    return {"json": "update", "admin": "keep_admin"}.get(prefer or "", "conflict")
