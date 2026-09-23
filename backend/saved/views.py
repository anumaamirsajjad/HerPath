from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from matching.engine import conflicts
from scholarships.models import Scholarship
from scholarships.serializers import ScholarshipListSerializer

from .models import SavedScholarship


class SavedList(APIView):
    def get(self, request):
        saved = SavedScholarship.objects.filter(user=request.user).select_related("scholarship")
        items = []
        for sv in saved:
            row = ScholarshipListSerializer(sv.scholarship, context={"request": request}).data
            row["saved_at"] = sv.created_at
            items.append(row)
        pairs = conflicts([{"slug": sv.scholarship.slug, "allows_other_scholarship": sv.scholarship.allows_other_scholarship}
                           for sv in saved])
        return Response({"items": items, "conflicts": pairs})

    def post(self, request):
        s = get_object_or_404(Scholarship.objects.published(), slug=request.data.get("slug"))
        SavedScholarship.objects.get_or_create(user=request.user, scholarship=s)
        return Response({"slug": s.slug}, status=status.HTTP_201_CREATED)


class SavedDelete(APIView):
    def delete(self, request, slug):
        SavedScholarship.objects.filter(user=request.user, scholarship__slug=slug).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
