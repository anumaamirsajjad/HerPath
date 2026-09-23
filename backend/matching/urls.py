from django.urls import path

from . import views

urlpatterns = [
    path("match", views.MatchList.as_view()),
    path("match/unlocks", views.Unlocks.as_view()),
    path("match/<slug:slug>", views.MatchDetail.as_view()),
]
