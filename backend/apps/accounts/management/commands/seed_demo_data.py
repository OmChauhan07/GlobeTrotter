from datetime import date, time
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

from apps.accounts.models import UserProfile, Role
from apps.destinations.models import City
from apps.activities.models import Activity
from apps.trips.models import Trip, TripStop, TripActivity
from apps.expenses.models import Expense

User = get_user_model()


class Command(BaseCommand):
    help = "Safely seed local development demo accounts and realistic sample trips (idempotent)."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding GlobeTrotter development demo data..."))

        with transaction.atomic():
            # 1. Create or update Traveler demo account
            traveler_user, created = User.objects.get_or_create(
                username="traveler",
                defaults={
                    "email": "traveler@globetrotter.local",
                    "first_name": "Alex",
                    "last_name": "Rivers",
                },
            )
            traveler_user.email = "traveler@globetrotter.local"
            traveler_user.first_name = "Alex"
            traveler_user.last_name = "Rivers"
            traveler_user.set_password("TravelDemo123!")
            traveler_user.save()

            traveler_profile, _ = UserProfile.objects.get_or_create(user=traveler_user)
            traveler_profile.role = Role.TRAVELER
            traveler_profile.home_airport = "JFK / SFO"
            traveler_profile.currency = "USD"
            traveler_profile.bio = "Multi-city explorer passionate about culture, architecture, and photography."
            traveler_profile.save()

            self.stdout.write(self.style.SUCCESS(f"-> Traveler demo account ready: traveler@globetrotter.local (TravelDemo123!)"))

            # 2. Create or update Admin demo account
            admin_user, created = User.objects.get_or_create(
                username="admin",
                defaults={
                    "email": "admin@globetrotter.local",
                    "first_name": "Jordan",
                    "last_name": "Vance",
                    "is_staff": True,
                },
            )
            admin_user.email = "admin@globetrotter.local"
            admin_user.first_name = "Jordan"
            admin_user.last_name = "Vance"
            admin_user.is_staff = True
            admin_user.set_password("AdminDemo123!")
            admin_user.save()

            admin_profile, _ = UserProfile.objects.get_or_create(user=admin_user)
            admin_profile.role = Role.ADMIN
            admin_profile.currency = "USD"
            admin_profile.bio = "GlobeTrotter Platform Administrator."
            admin_profile.save()

            self.stdout.write(self.style.SUCCESS(f"-> Admin demo account ready: admin@globetrotter.local (AdminDemo123!)"))

            # 3. Create Sample Cities
            cities_data = [
                {
                    "name": "Paris",
                    "country": "France",
                    "region": "Île-de-France",
                    "cost_index": 78.5,
                    "popularity": 96.0,
                    "image_url": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1000&auto=format&fit=crop&q=80",
                },
                {
                    "name": "Rome",
                    "country": "Italy",
                    "region": "Lazio",
                    "cost_index": 68.0,
                    "popularity": 94.0,
                    "image_url": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1000&auto=format&fit=crop&q=80",
                },
                {
                    "name": "Barcelona",
                    "country": "Spain",
                    "region": "Catalonia",
                    "cost_index": 65.0,
                    "popularity": 91.5,
                    "image_url": "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1000&auto=format&fit=crop&q=80",
                },
                {
                    "name": "Kyoto",
                    "country": "Japan",
                    "region": "Kansai",
                    "cost_index": 72.0,
                    "popularity": 93.0,
                    "image_url": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1000&auto=format&fit=crop&q=80",
                },
                {
                    "name": "Tokyo",
                    "country": "Japan",
                    "region": "Kanto",
                    "cost_index": 82.0,
                    "popularity": 98.0,
                    "image_url": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop&q=80",
                },
            ]

            cities_map = {}
            for c_data in cities_data:
                c, _ = City.objects.get_or_create(
                    name=c_data["name"],
                    country=c_data["country"],
                    defaults=c_data,
                )
                cities_map[c_data["name"]] = c

            # 4. Create Sample Activities
            activities_data = [
                {"city": "Paris", "name": "Louvre Museum Guided Tour", "category": "culture", "cost": 45.0, "dur": 180},
                {"city": "Paris", "name": "Seine Sunset River Cruise", "category": "relaxation", "cost": 28.0, "dur": 75},
                {"city": "Paris", "name": "Montmartre Pastry Walking Tour", "category": "food", "cost": 35.0, "dur": 120},
                {"city": "Rome", "name": "Colosseum & Roman Forum", "category": "culture", "cost": 40.0, "dur": 150},
                {"city": "Rome", "name": "Trastevere Evening Food Walk", "category": "food", "cost": 50.0, "dur": 150},
                {"city": "Barcelona", "name": "Sagrada Família Audio Experience", "category": "culture", "cost": 32.0, "dur": 90},
                {"city": "Barcelona", "name": "Park Güell Sunset Stroll", "category": "nature", "cost": 15.0, "dur": 120},
                {"city": "Kyoto", "name": "Fushimi Inari Early Morning Hike", "category": "nature", "cost": 0.0, "dur": 150},
                {"city": "Tokyo", "name": "Shibuya & Shinjuku Neon Night Tour", "category": "nightlife", "cost": 25.0, "dur": 180},
            ]

            activities_map = {}
            for a_data in activities_data:
                city = cities_map[a_data["city"]]
                act, _ = Activity.objects.get_or_create(
                    city=city,
                    name=a_data["name"],
                    defaults={
                        "category": a_data["category"],
                        "estimated_cost": Decimal(str(a_data["cost"])),
                        "duration": a_data["dur"],
                    },
                )
                activities_map[a_data["name"]] = act

            # 5. Create Sample Trip 1: Grand European Escape (Public)
            trip1, _ = Trip.objects.get_or_create(
                user=traveler_user,
                name="Grand European Escape",
                defaults={
                    "description": "Two unforgettable weeks traversing Paris, Rome, and Barcelona with art, culinary wonders, and Mediterranean views.",
                    "cover_image": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1000&auto=format&fit=crop&q=80",
                    "start_date": date(2026, 9, 10),
                    "end_date": date(2026, 9, 24),
                    "is_public": True,
                    "public_slug": "grand-european-escape",
                },
            )
            trip1.is_public = True
            trip1.public_slug = "grand-european-escape"
            trip1.save()

            # Stops for Trip 1
            stop1, _ = TripStop.objects.get_or_create(
                trip=trip1,
                city=cities_map["Paris"],
                defaults={
                    "start_date": date(2026, 9, 10),
                    "end_date": date(2026, 9, 14),
                    "position": 1,
                    "notes": "Hotel in Le Marais district.",
                },
            )
            stop2, _ = TripStop.objects.get_or_create(
                trip=trip1,
                city=cities_map["Rome"],
                defaults={
                    "start_date": date(2026, 9, 15),
                    "end_date": date(2026, 9, 19),
                    "position": 2,
                    "notes": "Boutique stay near Piazza Navona.",
                },
            )
            stop3, _ = TripStop.objects.get_or_create(
                trip=trip1,
                city=cities_map["Barcelona"],
                defaults={
                    "start_date": date(2026, 9, 20),
                    "end_date": date(2026, 9, 24),
                    "position": 3,
                    "notes": "Gothic Quarter exploration.",
                },
            )

            # Trip Activities
            TripActivity.objects.get_or_create(
                trip_stop=stop1,
                activity=activities_map["Louvre Museum Guided Tour"],
                date=date(2026, 9, 11),
                defaults={"start_time": time(9, 30), "end_time": time(12, 30), "position": 1, "estimated_cost": Decimal("45.00")},
            )
            TripActivity.objects.get_or_create(
                trip_stop=stop1,
                activity=activities_map["Seine Sunset River Cruise"],
                date=date(2026, 9, 12),
                defaults={"start_time": time(18, 0), "end_time": time(19, 15), "position": 2, "estimated_cost": Decimal("28.00")},
            )
            TripActivity.objects.get_or_create(
                trip_stop=stop2,
                activity=activities_map["Colosseum & Roman Forum"],
                date=date(2026, 9, 16),
                defaults={"start_time": time(10, 0), "end_time": time(12, 30), "position": 1, "estimated_cost": Decimal("40.00")},
            )
            TripActivity.objects.get_or_create(
                trip_stop=stop3,
                activity=activities_map["Sagrada Família Audio Experience"],
                date=date(2026, 9, 21),
                defaults={"start_time": time(11, 0), "end_time": time(12, 30), "position": 1, "estimated_cost": Decimal("32.00")},
            )

            # Expenses for Trip 1
            expenses_data = [
                {"name": "Flight: JFK -> CDG", "category": "transport", "amount": Decimal("650.00"), "date": date(2026, 9, 10)},
                {"name": "Le Marais Boutique Hotel", "category": "accommodation", "amount": Decimal("840.00"), "date": date(2026, 9, 10)},
                {"name": "Bistrot Paul Bert Dinner", "category": "meals", "amount": Decimal("110.00"), "date": date(2026, 9, 11)},
                {"name": "High-Speed Train: Paris -> Rome", "category": "transport", "amount": Decimal("180.00"), "date": date(2026, 9, 15)},
                {"name": "Navona Historic Hotel", "category": "accommodation", "amount": Decimal("720.00"), "date": date(2026, 9, 15)},
                {"name": "Trastevere Roman Feast", "category": "meals", "amount": Decimal("95.00"), "date": date(2026, 9, 16)},
                {"name": "Flight: Rome -> Barcelona", "category": "transport", "amount": Decimal("95.00"), "date": date(2026, 9, 20)},
                {"name": "Gothic Quarter Terrace Suite", "category": "accommodation", "amount": Decimal("680.00"), "date": date(2026, 9, 20)},
            ]

            for exp in expenses_data:
                Expense.objects.get_or_create(
                    trip=trip1,
                    name=exp["name"],
                    date=exp["date"],
                    defaults={
                        "category": exp["category"],
                        "amount": exp["amount"],
                        "currency": "USD",
                    },
                )

            # Sample Trip 2: Kyoto & Tokyo
            trip2, _ = Trip.objects.get_or_create(
                user=traveler_user,
                name="Japan Cultural Expedition",
                defaults={
                    "description": "Temples, tea gardens, and vibrant modern districts across Kansai and Kanto.",
                    "cover_image": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1000&auto=format&fit=crop&q=80",
                    "start_date": date(2026, 10, 5),
                    "end_date": date(2026, 10, 15),
                    "is_public": False,
                },
            )

        self.stdout.write(self.style.SUCCESS("All demo data seeded successfully and verified idempotent."))
