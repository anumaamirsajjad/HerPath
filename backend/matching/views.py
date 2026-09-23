import datetime as dt

from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Profile
from scholarships.models import Scholarship
from scholarships.serializers import ScholarshipListSerializer

from .engine import evaluate, unlocks
from .services import evaluate_all, published_rows

TABS = ["apply_now", "almost", "future", "not_eligible"]


def _profile_data(user):
    p = Profile.objects.filter(user=user).first()
    return p.data if p else None


class MatchList(APIView):
    def get(self, request):
        data = _profile_data(request.user)
        tabs = {t: [] for t in TABS}
        if data is None:
            return Response({"has_profile": False, "tabs": tabs})
        results = evaluate_all(data, dt.date.today())
        by_slug = {s.slug: s for s in Scholarship.objects.published()}
        for slug, res in results.items():
            row = ScholarshipListSerializer(by_slug[slug], context={"request": request}).data
            row.update(score=res["score"], met_count=res["met_count"], total_count=res["total_count"],
                       gap_count=res["total_count"] - res["met_count"], tab=res["tab"])
            tabs[res["tab"]].append(row)
        for t in TABS:
            tabs[t].sort(key=lambda r: (-(r["score"] or 0), r["name"]))
        return Response({"has_profile": True, "tabs": tabs})


class MatchDetail(APIView):
    def get(self, request, slug):
        s = get_object_or_404(Scholarship.objects.published(), slug=slug)
        data = _profile_data(request.user)
        if data is None:
            return Response({"has_profile": False, "scholarship": slug})
        res = evaluate(s.requirements, data, s.deadline, dt.date.today())
        return Response({"has_profile": True, "scholarship": slug, **res})


class Unlocks(APIView):
    def get(self, request):
        data = _profile_data(request.user)
        if data is None:
            return Response({"unlocks": {}})
        return Response({"unlocks": unlocks(data, published_rows(), dt.date.today())})
