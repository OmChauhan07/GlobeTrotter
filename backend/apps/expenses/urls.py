from django.urls import path
from apps.expenses.views import (
    ExpenseDetailView,
    TripBudgetAnalyticsView,
    TripExpenseListCreateView,
)

urlpatterns = [
    path("trips/<int:pk>/budget/", TripBudgetAnalyticsView.as_view(), name="trip-budget-analytics"),
    path("trips/<int:pk>/expenses/", TripExpenseListCreateView.as_view(), name="trip-expense-list-create"),
    path("expenses/<int:pk>/", ExpenseDetailView.as_view(), name="expense-detail"),
]
