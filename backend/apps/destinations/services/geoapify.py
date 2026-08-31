import json
import logging
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional
from django.conf import settings
from django.db.models import Q

from apps.destinations.models import City
from apps.destinations.services.catalog import CURATED_ACTIVITIES, CURATED_CITIES

logger = logging.getLogger(__name__)

GEOAPIFY_CATEGORY_MAP = {
    "catering.restaurant": "food",
    "catering.cafe": "food",
    "catering.fast_food": "food",
    "catering.bar": "nightlife",
    "catering.pub": "nightlife",
    "entertainment.culture": "culture",
    "entertainment.museum": "culture",
    "entertainment.theme_park": "adventure",
    "entertainment.zoo": "nature",
    "entertainment.cinema": "other",
    "leisure.park": "nature",
    "leisure.spa": "relaxation",
    "tourism.sights": "culture",
    "tourism.attraction": "culture",
    "activity.sport_club": "adventure",
    "natural": "nature",
}

DEFAULT_CATEGORY_IMAGES = {
    "food": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
    "culture": "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=600&q=80",
    "nature": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
    "adventure": "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=600&q=80",
    "relaxation": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
    "nightlife": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80",
    "other": "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80",
}


def make_geoapify_request(url: str, timeout: int = 5) -> Optional[Dict[str, Any]]:
    """Safe HTTP requester for Geoapify API."""
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "GlobeTrotter/1.0", "Accept": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=timeout) as response:
            if response.status == 200:
                return json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        logger.warning("Geoapify request failed for %s: %s", url, exc)
    return None


def search_cities(query: str = "", country: str = "", limit: int = 12) -> List[Dict[str, Any]]:
    """
    Search cities using Geoapify Geocoding API if key configured;
    otherwise fallback gracefully to Database + Curated Catalog.
    """
    results: List[Dict[str, Any]] = []
    seen_keys = set()
    api_key = getattr(settings, "GEOAPIFY_API_KEY", "")
    timeout = getattr(settings, "GEOAPIFY_API_TIMEOUT", 5)

    if api_key and query.strip():
        params = {
            "text": query.strip(),
            "type": "city",
            "format": "json",
            "apiKey": api_key,
            "limit": str(limit),
        }
        if country.strip():
            params["filter"] = f"countrycode:{country.strip().lower()}"
        
        api_url = f"https://api.geoapify.com/v1/geocode/autocomplete?{urllib.parse.urlencode(params)}"
        data = make_geoapify_request(api_url, timeout=timeout)
        
        if data and "results" in data:
            for item in data.get("results", []):
                city_name = item.get("city") or item.get("name") or item.get("formatted", "").split(",")[0].strip()
                country_name = item.get("country") or ""
                region_name = item.get("state") or item.get("county") or ""
                lat = item.get("lat")
                lon = item.get("lon")
                
                key = (city_name.lower(), country_name.lower())
                if key not in seen_keys and city_name:
                    seen_keys.add(key)
                    # Lookup existing db city or curated image
                    existing_db = City.objects.filter(name__iexact=city_name, country__iexact=country_name).first()
                    matched_curated = next(
                        (c for c in CURATED_CITIES if c["name"].lower() == city_name.lower()),
                        None,
                    )
                    
                    img = (
                        (existing_db and existing_db.image_url)
                        or (matched_curated and matched_curated["image_url"])
                        or f"https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=800&q=80"
                    )
                    cost = existing_db.cost_index if existing_db else (matched_curated["cost_index"] if matched_curated else 3.0)
                    pop = existing_db.popularity if existing_db else (matched_curated["popularity"] if matched_curated else 4.0)

                    results.append({
                        "id": existing_db.id if existing_db else None,
                        "name": city_name,
                        "country": country_name,
                        "region": region_name,
                        "latitude": float(lat) if lat is not None else None,
                        "longitude": float(lon) if lon is not None else None,
                        "cost_index": cost,
                        "popularity": pop,
                        "image_url": img,
                        "source": "geoapify",
                    })

    # If external API returned few or no results (or no key provided), supplement with database + curated catalog
    if len(results) < limit:
        # Search local Database
        db_qs = City.objects.all()
        if query.strip():
            db_qs = db_qs.filter(Q(name__icontains=query.strip()) | Q(country__icontains=query.strip()))
        if country.strip():
            db_qs = db_qs.filter(country__icontains=country.strip())

        for city in db_qs[:limit]:
            key = (city.name.lower(), city.country.lower())
            if key not in seen_keys:
                seen_keys.add(key)
                results.append({
                    "id": city.id,
                    "name": city.name,
                    "country": city.country,
                    "region": city.region,
                    "latitude": float(city.latitude) if city.latitude else None,
                    "longitude": float(city.longitude) if city.longitude else None,
                    "cost_index": city.cost_index,
                    "popularity": city.popularity,
                    "image_url": city.image_url or "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=800&q=80",
                    "source": "database",
                })

        # Curated Catalog
        q_lower = query.strip().lower()
        country_lower = country.strip().lower()
        for curated in CURATED_CITIES:
            if q_lower and q_lower not in curated["name"].lower() and q_lower not in curated["country"].lower():
                continue
            if country_lower and country_lower not in curated["country"].lower():
                continue
            
            key = (curated["name"].lower(), curated["country"].lower())
            if key not in seen_keys:
                seen_keys.add(key)
                results.append({
                    "id": None,
                    "name": curated["name"],
                    "country": curated["country"],
                    "region": curated["region"],
                    "latitude": curated["latitude"],
                    "longitude": curated["longitude"],
                    "cost_index": curated["cost_index"],
                    "popularity": curated["popularity"],
                    "image_url": curated["image_url"],
                    "source": "catalog",
                })
            if len(results) >= limit:
                break

    return results[:limit]


def search_activities(
    city_name: str = "",
    category: str = "",
    max_cost: Optional[float] = None,
    max_duration: Optional[int] = None,
    query: str = "",
    limit: int = 20,
) -> List[Dict[str, Any]]:
    """
    Search activities using Geoapify Places API if key configured;
    otherwise fallback gracefully to Database + Curated Catalog.
    """
    results: List[Dict[str, Any]] = []
    seen_names = set()
    api_key = getattr(settings, "GEOAPIFY_API_KEY", "")
    timeout = getattr(settings, "GEOAPIFY_API_TIMEOUT", 5)

    # 1. Geoapify Places Search (if API key available and city provided)
    if api_key and (city_name.strip() or query.strip()):
        # First resolve coordinates for the city if provided
        target_city = search_cities(query=city_name or query, limit=1)
        if target_city and target_city[0].get("latitude") and target_city[0].get("longitude"):
            lat = target_city[0]["latitude"]
            lon = target_city[0]["longitude"]
            city_actual_name = target_city[0]["name"]
            
            geo_categories = "catering.restaurant,entertainment.culture,tourism.sights,leisure.park"
            if category:
                for gk, ck in GEOAPIFY_CATEGORY_MAP.items():
                    if ck == category:
                        geo_categories = gk
                        break

            params = {
                "categories": geo_categories,
                "filter": f"circle:{lon},{lat},15000",
                "bias": f"proximity:{lon},{lat}",
                "limit": str(limit),
                "apiKey": api_key,
            }
            if query.strip() and not city_name:
                params["name"] = query.strip()

            api_url = f"https://api.geoapify.com/v2/places?{urllib.parse.urlencode(params)}"
            data = make_geoapify_request(api_url, timeout=timeout)
            
            if data and "features" in data:
                for feat in data.get("features", []):
                    props = feat.get("properties", {})
                    name = props.get("name") or props.get("formatted", "").split(",")[0].strip()
                    if not name or name.lower() in seen_names:
                        continue
                    
                    seen_names.add(name.lower())
                    feat_cat = "other"
                    for cat_item in props.get("categories", []):
                        if cat_item in GEOAPIFY_CATEGORY_MAP:
                            feat_cat = GEOAPIFY_CATEGORY_MAP[cat_item]
                            break
                    
                    if category and feat_cat != category:
                        continue

                    cost = 25.00
                    duration = 90
                    if feat_cat == "food":
                        cost = 35.00
                        duration = 75
                    elif feat_cat == "culture":
                        cost = 20.00
                        duration = 120
                    elif feat_cat == "adventure":
                        cost = 45.00
                        duration = 180

                    if max_cost is not None and cost > max_cost:
                        continue
                    if max_duration is not None and duration > max_duration:
                        continue

                    results.append({
                        "id": None,
                        "name": name,
                        "city_name": city_actual_name,
                        "description": props.get("formatted") or f"Explore {name} in {city_actual_name}.",
                        "category": feat_cat,
                        "estimated_cost": cost,
                        "duration": duration,
                        "image_url": DEFAULT_CATEGORY_IMAGES.get(feat_cat, DEFAULT_CATEGORY_IMAGES["other"]),
                        "latitude": props.get("lat"),
                        "longitude": props.get("lon"),
                        "source": "geoapify",
                    })

    # 2. Database Activities fallback & supplement
    from apps.activities.models import Activity

    db_qs = Activity.objects.select_related("city").all()
    if city_name.strip():
        db_qs = db_qs.filter(Q(city__name__icontains=city_name.strip()) | Q(city__country__icontains=city_name.strip()))
    if category.strip():
        db_qs = db_qs.filter(category=category.strip())
    if query.strip():
        db_qs = db_qs.filter(Q(name__icontains=query.strip()) | Q(description__icontains=query.strip()))
    if max_cost is not None:
        db_qs = db_qs.filter(estimated_cost__lte=max_cost)
    if max_duration is not None:
        db_qs = db_qs.filter(duration__lte=max_duration)

    for act in db_qs[:limit]:
        if act.name.lower() not in seen_names:
            seen_names.add(act.name.lower())
            results.append({
                "id": act.id,
                "name": act.name,
                "city_name": act.city.name,
                "description": act.description,
                "category": act.category,
                "estimated_cost": float(act.estimated_cost),
                "duration": act.duration,
                "image_url": act.image_url or DEFAULT_CATEGORY_IMAGES.get(act.category, DEFAULT_CATEGORY_IMAGES["other"]),
                "latitude": float(act.latitude) if act.latitude else None,
                "longitude": float(act.longitude) if act.longitude else None,
                "source": "database",
            })

    # 3. Curated Activities Catalog fallback
    city_lower = city_name.strip().lower()
    q_lower = query.strip().lower()

    for item in CURATED_ACTIVITIES:
        if city_lower and city_lower not in item["city_name"].lower():
            continue
        if category and item["category"] != category:
            continue
        if q_lower and q_lower not in item["name"].lower() and q_lower not in item["description"].lower():
            continue
        if max_cost is not None and item["estimated_cost"] > max_cost:
            continue
        if max_duration is not None and item["duration"] > max_duration:
            continue

        if item["name"].lower() not in seen_names:
            seen_names.add(item["name"].lower())
            results.append({
                "id": None,
                "name": item["name"],
                "city_name": item["city_name"],
                "description": item["description"],
                "category": item["category"],
                "estimated_cost": item["estimated_cost"],
                "duration": item["duration"],
                "image_url": item["image_url"],
                "latitude": None,
                "longitude": None,
                "source": "catalog",
            })
        if len(results) >= limit:
            break

    return results[:limit]
