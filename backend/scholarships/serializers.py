import markdown
from rest_framework import serializers

from .models import ChangeLog, Guide, ProblemReport, Scholarship

BILINGUAL = ["name", "summary", "coverage", "who_for", "application_steps", "family_summary"]


def localized(obj, name, lang):
    """Return obj.<name>_<lang>, falling back to English when Urdu is empty."""
    return (getattr(obj, f"{name}_{lang}") if lang == "ur" else "") or getattr(obj, f"{name}_en")


class LangMixin:
    @property
    def lang(self):
        req = self.context.get("request")
        return "ur" if req and req.query_params.get("lang") == "ur" else "en"

    def to_representation(self, obj):
        d = super().to_representation(obj)
        for name in self.Meta.bilingual:
            d[name] = localized(obj, name, self.lang)
        return d


class ScholarshipListSerializer(LangMixin, serializers.ModelSerializer):
    class Meta:
        model = Scholarship
        bilingual = ["name", "summary"]
        fields = ["slug", "provider", "location", "country", "levels", "types", "covers", "funding",
                  "women_only", "female_quota", "allows_other_scholarship", "university_type",
                  "provinces", "income_limit", "test_requirement", "special_categories",
                  "usual_opening_month", "status", "deadline", "last_verified"]


class ScholarshipDetailSerializer(LangMixin, serializers.ModelSerializer):
    class Meta:
        model = Scholarship
        bilingual = BILINGUAL
        fields = ScholarshipListSerializer.Meta.fields + [
            "required_documents", "requirements", "official_link", "next_check"]


class GuideSerializer(LangMixin, serializers.ModelSerializer):
    body = serializers.SerializerMethodField()

    class Meta:
        model = Guide
        bilingual = ["title"]
        fields = ["slug", "days_needed", "body"]

    def get_body(self, obj):
        return markdown.markdown(localized(obj, "body", self.lang))


class GuideListSerializer(LangMixin, serializers.ModelSerializer):
    class Meta:
        model = Guide
        bilingual = ["title"]
        fields = ["slug", "days_needed"]


class ChangeLogSerializer(serializers.ModelSerializer):
    scholarship = serializers.SlugRelatedField(slug_field="slug", read_only=True)

    class Meta:
        model = ChangeLog
        fields = ["scholarship", "date", "source", "note"]


class ProblemReportSerializer(serializers.ModelSerializer):
    scholarship = serializers.SlugRelatedField(slug_field="slug", queryset=Scholarship.objects.all(),
                                               required=False, allow_null=True)

    class Meta:
        model = ProblemReport
        fields = ["scholarship", "message"]
