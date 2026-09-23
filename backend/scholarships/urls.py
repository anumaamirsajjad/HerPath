from django.urls import path

from . import views

urlpatterns = [
    path("scholarships", views.ScholarshipList.as_view()),
    path("scholarships/<slug:slug>", views.ScholarshipDetail.as_view()),
    path("guides", views.GuideList.as_view()),
    path("guides/<slug:slug>", views.GuideDetail.as_view()),
    path("changelog", views.ChangeLogList.as_view()),
    path("reports", views.ReportCreate.as_view()),
]
