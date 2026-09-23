from django import forms
from django.contrib import admin

from .models import ChangeLog, Guide, ProblemReport, Scholarship


class ScholarshipForm(forms.ModelForm):
    class Meta:
        model = Scholarship
        fields = "__all__"

    def clean_requirements(self):
        from matching.engine import validate_requirements

        rules = self.cleaned_data["requirements"]
        errors = validate_requirements(rules)
        if errors:
            raise forms.ValidationError("; ".join(errors))
        return rules


class ChangeLogInline(admin.TabularInline):
    model = ChangeLog
    extra = 1


@admin.register(Scholarship)
class ScholarshipAdmin(admin.ModelAdmin):
    form = ScholarshipForm
    list_display = ["name_en", "location", "status", "deadline", "last_verified", "next_check", "is_published"]
    list_filter = ["location", "status", "is_published"]
    search_fields = ["name_en", "provider"]
    inlines = [ChangeLogInline]


@admin.register(Guide)
class GuideAdmin(admin.ModelAdmin):
    list_display = ["slug", "title_en", "days_needed"]


@admin.register(ProblemReport)
class ProblemReportAdmin(admin.ModelAdmin):
    list_display = ["created_at", "scholarship", "message"]
    readonly_fields = ["created_at"]
