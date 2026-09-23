from django.urls import path

from . import views

urlpatterns = [
    path("saved", views.SavedList.as_view()),
    path("saved/<slug:slug>", views.SavedDelete.as_view()),
]
