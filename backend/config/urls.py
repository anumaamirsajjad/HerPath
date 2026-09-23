from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", lambda r: JsonResponse({"ok": True})),
    path("api/auth/", include("accounts.auth_urls")),
    path("api/", include("accounts.urls")),
    path("api/", include("scholarships.urls")),
    path("api/", include("matching.urls")),
    path("api/", include("saved.urls")),
    path("api/", include("counters.urls")),
]
