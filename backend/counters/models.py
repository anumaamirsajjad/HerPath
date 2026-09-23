from django.db import models
from django.db.models import F

KEYS = ["profiles_created", "gaps_closed", "moved_to_apply_now", "family_shared"]


class Counter(models.Model):
    key = models.CharField(max_length=40, unique=True)
    count = models.PositiveBigIntegerField(default=0)


def increment(key, n=1):
    if n <= 0:
        return
    Counter.objects.get_or_create(key=key)
    Counter.objects.filter(key=key).update(count=F("count") + n)
