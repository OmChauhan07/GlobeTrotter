# 🌍 GlobeTrotter — Multi-City Travel Planning Platform

**GlobeTrotter** is a modern, full-stack travel planning platform designed to make multi-city itinerary creation, activity discovery, budget analytics, and public sharing effortless and visual.

---

## 🌟 Key Features

1. **Interactive Multi-City Itinerary Builder**
   - Plan journeys across multiple destinations with custom arrival and departure date boundaries.
   - Reorder destination stops and scheduled activities seamlessly via fluid drag-and-drop (`@dnd-kit`).
   - Categorize experiences (Culture, Food, Adventure, Nature, Relaxation, Nightlife, Transport, Accommodation).

2. **Smart Destination & Activity Discovery**
   - Live external search powered by **Geoapify Places API** with server-side rate-limiting and timeouts.
   - Built-in resilient **Curated Catalog Fallback Engine** providing rich destinations and experiences even when external APIs are offline.
   - One-click "Add to Itinerary" and destination bookmarking.

3. **Visual Budget & Cost Analytics Engine**
   - Server-authoritative budget tracking with non-negative validation and trip boundary checks.
   - Interactive data visualizations with **Recharts** (Category Spend Donut, Daily Expenditure Bar Charts).
   - Over-budget warning thresholds and automated daily spend alerts.

4. **Calendar & Chronological Timeline Matrix**
   - Three switchable view modes: **Timeline** (chronological time-slotted flow), **Calendar** (multi-week grid with day inspector), and **List** (structured agenda).
   - Quick Edit and Quick Add modals for rapid itinerary adjustments.

5. **Public Itinerary Sharing & Trip Duplication**
   - Generate SEO-friendly, unique public share links (`/public/trip/<slug>`).
   - Public showcase page with rich hero banner, author attribution, destination cards, and full timeline view.
   - One-click **"Copy Itinerary to My Trips"** duplicating entire trips, stops, activities, and budget records into any authenticated traveler's account.

6. **Secure User Authentication & Profile Suite**
   - Custom user model with JWT authentication (`django-rest-framework-simplejwt`).
   - Token refresh rotation, password reset flows, and profile management.

---

## 🏗 Architecture & Tech Stack

```
[ Frontend: React + Vite ]  ←─ (REST API / JWT) ─→  [ Backend: Django REST Framework ]
         │                                                      │
         ├── TanStack Query / Axios                             ├── Django ORM / dj-database-url
         ├── @dnd-kit (Drag-and-Drop)                           ├── SimpleJWT Authentication
         ├── Recharts (Visual Analytics)                        ├── drf-spectacular (OpenAPI / Swagger)
         └── Lucide Icons                                       └── Geoapify Places Provider
                                                                        │
                                                                        ▼
                                                         [ Database: Neon PostgreSQL ]
```

### Stack Breakdown

- **Frontend**: React 18, Vite, React Router v7, TanStack Query, Recharts, `@dnd-kit`, Lucide React, CSS Variables Design System.
- **Backend**: Python 3.12, Django 6.1, Django REST Framework, SimpleJWT, `dj-database-url`, `drf-spectacular`, `django-cors-headers`.
- **Database**: PostgreSQL (Serverless Neon).
- **External Services**: Geoapify Places & Geocoding API.
- **Testing**: Vitest & React Testing Library (Frontend), Django TestCase & APITestCase (Backend).
- **CI / CD**: GitHub Actions.

---

## 📁 Repository Structure

```
GlobeTrotter/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Automated CI test & build pipeline
├── backend/
│   ├── apps/
│   │   ├── accounts/             # Custom User, authentication, and profiles
│   │   ├── destinations/         # Cities, destinations, and Geoapify proxy
│   │   ├── activities/           # Curated activities catalog & search
│   │   ├── trips/                # Trips, stops, activities, reordering, sharing
│   │   └── expenses/             # Budget analytics service & expense CRUD
│   ├── config/                   # Django settings, WSGI, URLs, and OpenAPI config
│   ├── requirements.txt          # Python dependencies
│   ├── manage.py
│   ├── .env.example              # Backend environment template
│   ├── Procfile                  # Web process configuration
│   └── render.yaml               # Render infrastructure-as-code deployment
├── frontend/
│   ├── src/
│   │   ├── api/                  # Axios HTTP client with JWT interceptors
│   │   ├── components/           # UI design system & App Shell layout
│   │   ├── context/              # Authentication context
│   │   ├── hooks/                # Custom React hooks
│   │   ├── pages/                # Itinerary Builder, Discovery, Budget, Calendar, Public
│   │   ├── routes/               # Application routing
│   │   └── App.css               # Design system & responsive styles
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json               # SPA routing rewrite rules for Vercel
│   └── .env.example              # Frontend environment template
└── README.md
```

---

## 🚀 Local Development Setup

### Prerequisites
- **Python 3.12+**
- **Node.js 20+** and **npm**
- **PostgreSQL** or **Neon Database Account**

---

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a Python virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your SECRET_KEY, DATABASE_URL, and optional GEOAPIFY_API_KEY

# Run database migrations
python manage.py migrate

# (Optional) Seed initial destination data
python manage.py loaddata apps/destinations/fixtures/initial_destinations.json

# Start the Django development server
python manage.py runserver 8000
```

The Django REST API will be available at `http://127.0.0.1:8000/api/`.  
Interactive Swagger API documentation is available at `http://127.0.0.1:8000/api/docs/`.

---

### 2. Frontend Setup

```bash
# In a new terminal window, navigate to frontend
cd frontend

# Install Node dependencies
npm install

# Configure environment variables (optional for local proxy)
cp .env.example .env

# Start the Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser to launch GlobeTrotter.

---

## 🧪 Automated Testing Suite

### Running Backend Tests (Django)

```bash
# Run all backend unit tests across all applications
python backend/manage.py test apps.trips apps.expenses apps.destinations apps.activities apps.accounts

# Run Django system checks
python backend/manage.py check
```

### Running Frontend Tests (Vitest & RTL)

```bash
# Run all frontend unit and integration tests
npm test --prefix frontend

# Run ESLint linter
npm run lint --prefix frontend

# Test production build
npm run build --prefix frontend
```

---

## 🌐 Production Deployment Guide

### Database (Neon PostgreSQL)
1. Create a serverless project at [neon.tech](https://neon.tech).
2. Copy the pooled connection string into `DATABASE_URL`.

### Backend (Render / Railway)
1. Connect your repository to Render or Railway.
2. Select `backend` as the root directory.
3. Configure the build and start commands:
   - **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate`
   - **Start Command**: `gunicorn config.wsgi:application`
4. Set production environment variables:
   - `DEBUG=False`
   - `SECRET_KEY=<strong-random-key>`
   - `DATABASE_URL=<your-neon-url>`
   - `ALLOWED_HOSTS=.onrender.com,api.yourdomain.com`
   - `CORS_ALLOWED_ORIGINS=https://globetrotter.vercel.app`
   - `GEOAPIFY_API_KEY=<your-key>`

### Frontend (Vercel)
1. Import repository into [Vercel](https://vercel.com).
2. Set root directory to `frontend`.
3. Framework Preset: **Vite**.
4. Set Environment Variable:
   - `VITE_API_BASE_URL=https://your-backend.onrender.com/api`
5. Deploy. `frontend/vercel.json` ensures all client-side routes resolve properly.

---

## 🎬 End-to-End Demo Walkthrough

1. **Sign Up / Log In**: Create an account or sign in to access your private dashboard.
2. **Create a Trip**: Enter a trip name, dates, description, and optional cover image.
3. **Build Multi-City Itinerary**: Add destination stops (e.g. Paris &rarr; Rome) and schedule activities with categories, times, and estimated costs.
4. **Discover Experiences**: Open the Discovery tab to search Geoapify attractions and bookmark them to your trip.
5. **Analyze Budget**: Visit the Budget tab to inspect Recharts visual analytics, check category breakdowns, and monitor daily expenses.
6. **Review Schedule**: View your journey in the Timeline, Calendar grid, or List view.
7. **Share Itinerary**: Click "Share" to generate a public link and copy the URL.
8. **Copy / Clone**: Open the public link in an incognito window and click "Copy Itinerary to My Trips" to clone the entire trip into your account!

---

## 📄 License

MIT License. Designed and engineered for the GlobeTrotter Hackathon.