from django.contrib.postgres.fields import ArrayField
from django.core.exceptions import ValidationError
from django.db import models

LOCATIONS = [("pakistan", "Pakistan"), ("abroad", "Abroad")]
FUNDING = [("full", "Fully funded"), ("partial", "Partial"), ("tuition_only", "Tuition only"), ("stipend_only", "Stipend only")]
UNI_TYPES = [("any", "Any"), ("public", "Public"), ("private", "Private"), ("partner", "Partner universities")]
TEST_REQ = [("required", "Required"), ("waiver_possible", "Waiver possible"), ("none", "None")]
STATUS = [("open", "Open"), ("closed", "Closed"), ("expected", "Expected")]


def bilingual(**kw):
    """Two TextFields, `<name>_en` (required) and `<name>_ur` (blank ok)."""
    return models.TextField(**kw), models.TextField(blank=True, default="", **kw)


class ScholarshipQuerySet(models.QuerySet):
    def published(self):
        return self.filter(is_published=True)


class Scholarship(models.Model):
    slug = models.SlugField(unique=True)
    provider = models.CharField(max_length=200)
    location = models.CharField(max_length=10, choices=LOCATIONS)
    country = models.CharField(max_length=60, default="Pakistan")

    name_en = models.CharField(max_length=200)
    name_ur = models.CharField(max_length=200, blank=True, default="")
    summary_en, summary_ur = bilingual()
    coverage_en, coverage_ur = bilingual()
    who_for_en, who_for_ur = bilingual()
    application_steps_en, application_steps_ur = bilingual()
    family_summary_en, family_summary_ur = bilingual()

    levels = ArrayField(models.CharField(max_length=20), default=list)
    types = ArrayField(models.CharField(max_length=10), default=list)
    covers = ArrayField(models.CharField(max_length=20), default=list)
    funding = models.CharField(max_length=20, choices=FUNDING, default="partial")
    women_only = models.BooleanField(default=False)
    female_quota = models.BooleanField(default=False)
    allows_other_scholarship = models.BooleanField(default=False)
    university_type = models.CharField(max_length=10, choices=UNI_TYPES, default="any")
    provinces = ArrayField(models.CharField(max_length=30), default=list, blank=True)
    income_limit = models.PositiveIntegerField(null=True, blank=True)
    test_requirement = models.CharField(max_length=20, choices=TEST_REQ, default="none")
    special_categories = ArrayField(models.CharField(max_length=20), default=list, blank=True)
    required_documents = ArrayField(models.CharField(max_length=30), default=list, blank=True)

    requirements = models.JSONField(default=list)

    usual_opening_month = models.PositiveSmallIntegerField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS, default="expected")
    deadline = models.DateField(null=True, blank=True)
    official_link = models.URLField()
    last_verified = models.DateField()
    next_check = models.DateField()
    is_published = models.BooleanField(default=True)

    objects = ScholarshipQuerySet.as_manager()

    class Meta:
        ordering = ["name_en"]

    def __str__(self):
        return self.name_en

    def clean(self):
        from matching.engine import validate_requirements

        errors = validate_requirements(self.requirements)
        if errors:
            raise ValidationError({"requirements": errors})


class ChangeLog(models.Model):
    scholarship = models.ForeignKey(Scholarship, on_delete=models.CASCADE, related_name="changes")
    date = models.DateField()
    source = models.URLField(blank=True, default="")
    note = models.TextField()

    class Meta:
        ordering = ["-date", "-id"]


class ProblemReport(models.Model):
    scholarship = models.ForeignKey(Scholarship, null=True, blank=True, on_delete=models.SET_NULL)
    message = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)


class Guide(models.Model):
    slug = models.SlugField(unique=True)
    title_en = models.CharField(max_length=200)
    title_ur = models.CharField(max_length=200, blank=True, default="")
    body_en, body_ur = bilingual()
    days_needed = models.PositiveSmallIntegerField(default=14)

    def __str__(self):
        return self.title_en
