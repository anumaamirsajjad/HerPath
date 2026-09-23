from scholarships.models import Scholarship

from .engine import evaluate


def published_rows():
    return list(Scholarship.objects.published().values("slug", "requirements", "deadline"))


def evaluate_all(profile_data, today):
    """slug -> evaluate() result for every published scholarship."""
    return {r["slug"]: evaluate(r["requirements"], profile_data, r["deadline"], today)
            for r in published_rows()}
