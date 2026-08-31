from datetime import timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional
from django.db.models import Sum

from apps.trips.models import Trip

# Mapping of any legacy/alias categories to canonical categories
CATEGORY_NORMALIZE_MAP = {
    "transport": "transport",
    "flight": "transport",
    "accommodation": "accommodation",
    "lodging": "accommodation",
    "activities": "activities",
    "activity": "activities",
    "meals": "meals",
    "food": "meals",
    "other": "other",
    "shopping": "other",
}

CANONICAL_CATEGORIES = ["transport", "accommodation", "activities", "meals", "other"]


def calculate_trip_budget(
    trip: Trip,
    daily_budget_limit: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Authoritative server-side calculation of trip budget, category totals,
    daily spending trends, average cost per day, and over-budget day alerts.
    """
    # 1. Calculate duration in days (inclusive)
    if trip.start_date and trip.end_date:
        days_count = max((trip.end_date - trip.start_date).days + 1, 1)
    else:
        days_count = 1

    # 2. Fetch all logged expenses
    expenses = list(trip.expenses.select_related("trip_stop", "trip_stop__city").all())

    # 3. Aggregate category totals
    category_totals: Dict[str, Decimal] = {cat: Decimal("0.00") for cat in CANONICAL_CATEGORIES}
    daily_expenses_map: Dict[str, List[Any]] = {}

    total_cost = Decimal("0.00")
    base_currency = "USD"

    for exp in expenses:
        raw_cat = (exp.category or "other").lower()
        canonical_cat = CATEGORY_NORMALIZE_MAP.get(raw_cat, "other")
        amount = Decimal(str(exp.amount or 0.00))

        category_totals[canonical_cat] += amount
        total_cost += amount
        if exp.currency:
            base_currency = exp.currency

        date_str = exp.date.isoformat() if exp.date else (trip.start_date.isoformat() if trip.start_date else "")
        if date_str:
            daily_expenses_map.setdefault(date_str, []).append(exp)

    # 4. Average cost per day
    average_per_day = round(float(total_cost) / days_count, 2) if days_count > 0 else float(total_cost)

    # 5. Over-budget threshold calculation
    # If a daily budget limit is set by user, use that; otherwise flag days exceeding 1.5x of average (if average > 0)
    if daily_budget_limit is not None and daily_budget_limit > 0:
        threshold = daily_budget_limit
    elif average_per_day > 0:
        threshold = round(average_per_day * 1.5, 2)
    else:
        threshold = 0.0

    # 6. Generate chronological daily breakdown for each day of the trip
    daily_breakdown: List[Dict[str, Any]] = []
    over_budget_days: List[Dict[str, Any]] = []

    if trip.start_date and trip.end_date:
        current_date = trip.start_date
        while current_date <= trip.end_date:
            d_str = current_date.isoformat()
            day_exps = daily_expenses_map.get(d_str, [])
            
            day_total = Decimal("0.00")
            day_cats: Dict[str, float] = {cat: 0.0 for cat in CANONICAL_CATEGORIES}

            for exp in day_exps:
                c_cat = CATEGORY_NORMALIZE_MAP.get((exp.category or "other").lower(), "other")
                amt = float(exp.amount or 0)
                day_total += Decimal(str(amt))
                day_cats[c_cat] += amt

            day_total_float = float(day_total)
            is_over = bool(threshold > 0 and day_total_float > threshold)

            day_data = {
                "date": d_str,
                "total": day_total_float,
                "items_count": len(day_exps),
                "is_over_budget": is_over,
                "threshold": threshold,
                "categories": day_cats,
            }
            daily_breakdown.append(day_data)

            if is_over:
                over_budget_days.append({
                    "date": d_str,
                    "total": day_total_float,
                    "threshold": threshold,
                    "excess": round(day_total_float - threshold, 2),
                })

            current_date += timedelta(days=1)

    # 7. Category percentages
    category_summary: Dict[str, Dict[str, Any]] = {}
    for cat in CANONICAL_CATEGORIES:
        amt = float(category_totals[cat])
        pct = round((amt / float(total_cost) * 100), 1) if float(total_cost) > 0 else 0.0
        category_summary[cat] = {
            "amount": amt,
            "percentage": pct,
        }

    return {
        "trip_id": trip.id,
        "trip_name": trip.name,
        "currency": base_currency,
        "total": float(total_cost),
        "average_per_day": average_per_day,
        "days_count": days_count,
        "daily_threshold": threshold,
        "category_breakdown": category_summary,
        "daily_breakdown": daily_breakdown,
        "over_budget_days": over_budget_days,
        "expenses_count": len(expenses),
    }
