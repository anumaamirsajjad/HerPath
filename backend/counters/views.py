from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .models import KEYS, Counter, increment


class CounterList(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        counts = dict(Counter.objects.values_list("key", "count"))
        return Response({k: counts.get(k, 0) for k in KEYS})


class CounterIncrement(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request, key):
        if key != "family_shared":
            return Response({"detail": "Only family_shared can be incremented by clients."}, status=400)
        increment(key)
        return Response(status=status.HTTP_204_NO_CONTENT)
