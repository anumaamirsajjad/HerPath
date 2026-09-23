from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

urlpatterns = [
    path("signup", views.SignupView.as_view()),
    path("login", TokenObtainPairView.as_view()),
    path("refresh", TokenRefreshView.as_view()),
    path("me", views.MeView.as_view()),
    path("password-reset", views.PasswordResetView.as_view()),
    path("password-reset/confirm", views.PasswordResetConfirmView.as_view()),
]
