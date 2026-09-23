from django.contrib import admin
from django.db import models

from .models import ChangeLog, Guide, ProblemReport, Scholarship


class ChangeLogInline(admin.TabularInline):
    model = ChangeLog
    extra = 1


@admin.register(Scholarship)
class ScholarshipAdmin(admin.ModelAdmin):
    # Scholarship.clean() validates `requirements` with the rule engine.
    formfield_overrides = {models.URLField: {"assume_scheme": "https"}}
    list_display = ["name_en", "location", "status", "deadline", "last_verified", "next_check", "is_published"]
    list_filter = ["location", "status", "is_published"]
    search_fields = ["name_en", "provider"]
    inlines = [ChangeLogInline]


@admin.register(Guide)
class GuideAdmin(admin.ModelAdmin):
    list_display = ["slug", "title_en", "days_needed"]


@admin.register(ProblemReport)
class ProblemReportAdmin(admin.ModelAdmin):
    formfield_overrides = {models.URLField: {"assume_scheme": "https"}}
    list_display = ["created_at", "scholarship", "message"]
    readonly_fields = ["created_at"]
