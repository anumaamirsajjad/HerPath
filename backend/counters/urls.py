from django.urls import path

from . import views

urlpatterns = [
    path("counters", views.CounterList.as_view()),
    path("counters/<str:key>", views.CounterIncrement.as_view()),
]
