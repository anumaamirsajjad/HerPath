from django.conf import settings
from django.db import models


class SavedScholarship(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved")
    scholarship = models.ForeignKey("scholarships.Scholarship", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("user", "scholarship")]
        ordering = ["scholarship__name_en"]
