from rest_framework import generics, permissions
from rest_framework.throttling import AnonRateThrottle

from . import serializers as s
from .models import ChangeLog, Guide, Scholarship


class Public(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]


class ScholarshipList(Public, generics.ListAPIView):
    queryset = Scholarship.objects.published()
    serializer_class = s.ScholarshipListSerializer


class ScholarshipDetail(Public, generics.RetrieveAPIView):
    queryset = Scholarship.objects.published()
    serializer_class = s.ScholarshipDetailSerializer
    lookup_field = "slug"


class GuideList(Public, generics.ListAPIView):
    queryset = Guide.objects.order_by("slug")
    serializer_class = s.GuideListSerializer


class GuideDetail(Public, generics.RetrieveAPIView):
    queryset = Guide.objects.all()
    serializer_class = s.GuideSerializer
    lookup_field = "slug"


class ChangeLogList(Public, generics.ListAPIView):
    serializer_class = s.ChangeLogSerializer

    def get_queryset(self):
        qs = ChangeLog.objects.select_related("scholarship")
        slug = self.request.query_params.get("scholarship")
        return qs.filter(scholarship__slug=slug) if slug else qs


class ReportThrottle(AnonRateThrottle):
    scope = "reports"


class ReportCreate(Public, generics.CreateAPIView):
    serializer_class = s.ProblemReportSerializer
    throttle_classes = [ReportThrottle]
