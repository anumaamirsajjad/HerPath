import datetime as dt

from django.contrib import admin
from django.db import models

from .models import ChangeLog, Guide, ProblemReport, Scholarship


URL_HTTPS = {models.URLField: {"assume_scheme": "https"}}


class ChangeLogInline(admin.TabularInline):
    model = ChangeLog
    extra = 1
    formfield_overrides = URL_HTTPS


class VerificationDue(admin.SimpleListFilter):
    title = "verification"
    parameter_name = "verification"

    def lookups(self, request, model_admin):
        return [("due", "Due for verification")]

    def queryset(self, request, queryset):
        return queryset.filter(next_check__lte=dt.date.today()) if self.value() == "due" else queryset


@admin.register(Scholarship)
class ScholarshipAdmin(admin.ModelAdmin):
    # Scholarship.clean() validates `requirements` with the rule engine.
    formfield_overrides = URL_HTTPS
    list_display = ["name_en", "location", "status", "deadline", "last_verified", "next_check", "is_published"]
    list_filter = [VerificationDue, "location", "status", "is_published"]
    search_fields = ["name_en", "provider"]
    ordering = ["next_check"]
    inlines = [ChangeLogInline]

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        if change and form.changed_data:
            # Every edit leaves a public trace; curators can add a source or detail in the inline.
            ChangeLog.objects.create(scholarship=obj, date=dt.date.today(), source=obj.official_link,
                                     note="Updated: " + ", ".join(form.changed_data))


@admin.register(Guide)
class GuideAdmin(admin.ModelAdmin):
    list_display = ["slug", "title_en", "days_needed"]


@admin.register(ProblemReport)
class ProblemReportAdmin(admin.ModelAdmin):
    list_display = ["created_at", "scholarship", "message", "resolved"]
    list_editable = ["resolved"]
    list_filter = ["resolved"]
    readonly_fields = ["created_at", "scholarship", "message"]

    def has_add_permission(self, request):
        return False
