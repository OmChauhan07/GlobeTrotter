# 🚀 GlobeTrotter — Production Deployment Architecture & Guide

This document outlines the complete production deployment setup for **GlobeTrotter** across **Vercel** (Frontend) and **Render** (Backend), integrated with **Neon PostgreSQL**, **Resend** (OTP & Transactional Email), and **Cloudinary** (Media & Asset Storage).

```text
                                GitHub Repository
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
    [ Vercel Frontend ]                                   [ Render Backend ]
    React 18 + Vite SPA                                   Django 6.1 + DRF
    Root: frontend/                                       Root: backend/
    SPA Rewrites: vercel.json                             Build: ./build.sh
    VITE_API_BASE_URL                                     Server: Gunicorn + ASGI Uvicorn
            │                                                     │
            │                  REST API / JWT Auth                │
            └─────────────────────────────────────────────────────┤
                                                                  ├── [ Neon PostgreSQL ] (Database)
                                                                  ├── [ Resend API ] (Email & OTP)
                                                                  └── [ Cloudinary ] (Avatar & Trip Media)
```

---

## 🏗 Track 1: Vercel Frontend Deployment

### 1. Build & Project Configuration
- **Vercel Project Root**: `frontend/`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm ci`

### 2. SPA Routing Fallback (`frontend/vercel.json`)
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
*Guarantees direct URL navigation and page refreshes work smoothly across all routes (e.g. `/dashboard`, `/trips/123`, `/discover`, `/public/trip/<slug>`).*

### 3. Environment Variables (Browser-Safe Only)
| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Full URL to the deployed backend `/api` endpoint | `https://globetrotter-api.onrender.com/api` |

---

## ⚙️ Track 2: Render Backend Deployment

### 1. Web Service Configuration
- **Environment**: `Python 3.12`
- **Root Directory**: `backend/`
- **Build Command**: `bash ./build.sh`
- **Start Command**: `python -m gunicorn config.asgi:application -k uvicorn.workers.UvicornWorker`
- **Health Check Endpoint**: `GET /api/health/` &rarr; `{"status":"ok"}`

### 2. Build Pipeline Script (`backend/build.sh`)
```bash
#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
```

### 3. Static & Media Asset Separation
- **Static Assets (Admin, CSS, JS)**: Served with compression and cache-busting via **WhiteNoise** (`whitenoise.storage.CompressedManifestStaticFilesStorage`).
- **User & Trip Media Uploads**: Validated server-side (JPEG/PNG/WebP, max 5MB) and securely stored in **Cloudinary**, with HTTPS asset URLs persisted in PostgreSQL.

### 4. Production Environment Variables (Server-Side)
| Variable | Required | Description | Example |
|---|---|---|---|
| `DEBUG` | Yes | Disable Django debug mode in production | `False` |
| `SECRET_KEY` | Yes | Cryptographic secret key for Django | `django-insecure-strong-random-key...` |
| `DATABASE_URL` | Yes | Neon PostgreSQL pooled connection string | `postgres://user:pass@ep-xyz.neon.tech/globetrotter?sslmode=require` |
| `ALLOWED_HOSTS` | Yes | Comma-separated list of backend domains | `.onrender.com,api.globetrotter.travel,localhost` |
| `CORS_ALLOWED_ORIGINS` | Yes | Comma-separated list of frontend Vercel domains | `https://globetrotter.vercel.app,https://globetrotter-travel.vercel.app` |
| `CSRF_TRUSTED_ORIGINS` | Optional | Comma-separated list of trusted origins for CSRF | `https://globetrotter.vercel.app` |
| `RESEND_API_KEY` | Yes | Resend API key for transactional emails | `re_123456789abcdef` |
| `EMAIL_FROM` | Yes | Verified sender email on your Resend domain | `GlobeTrotter <noreply@yourdomain.com>` |
| `CLOUDINARY_URL` | Yes | Cloudinary connection URL | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` |
| `GEOAPIFY_API_KEY` | Optional | Geoapify API key for live external destination search | `your_geoapify_key` |
| `GEOAPIFY_API_TIMEOUT` | Optional | Timeout (seconds) for external Geoapify requests | `5` |
| `OTP_EXPIRY_MINUTES` | Optional | Registration OTP expiration window | `10` |
| `OTP_RESEND_COOLDOWN_SECONDS` | Optional | Rate limit cooldown for OTP resends | `60` |
| `OTP_MAX_ATTEMPTS` | Optional | Maximum failed verification attempts before invalidation | `5` |

---

## 📧 Track 3: Resend Email & Domain Verification

1. Create an account and API key at [resend.com](https://resend.com).
2. Add your custom domain under **Domains** in Resend.
3. Configure the required DNS records at your domain registrar:
   - `TXT` (SPF)
   - `TXT` / `CNAME` (DKIM)
   - `MX` (Inbound/Return-Path)
4. Once verified, set `EMAIL_FROM=GlobeTrotter <noreply@yourdomain.com>` in Render.
5. In development / testing environments, `DEV_OTP_MODE=True` outputs OTP codes directly to the terminal without requiring email dispatches.

---

## 🖼 Track 4: Cloudinary Media Uploads

1. Create a Cloudinary account at [cloudinary.com](https://cloudinary.com).
2. Copy your **API Environment variable** (`CLOUDINARY_URL=cloudinary://...`).
3. Set `CLOUDINARY_URL` in your Render Environment Variables.
4. Upload endpoints:
   - **Avatar Upload**: `POST /api/accounts/avatar/` (multipart form field `avatar` or `file`).
   - **Trip Cover Upload**: `POST /api/trips/<id>/cover/` (multipart form field `cover_image` or `file`).

---

## 🧪 Track 5: Verification & Production Smoke Testing

### Pre-Deployment Checklist
```bash
# 1. Check migrations plan
python backend/manage.py makemigrations --check
python backend/manage.py migrate --plan

# 2. Run Django production deployment checks
DEBUG=False SECRET_KEY="prod-key-sample-12345678901234567890" python backend/manage.py check --deploy

# 3. Run full test suites
python backend/manage.py test apps.accounts apps.trips apps.expenses apps.destinations apps.activities
npm test --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
```

### Production Smoke Test Matrix
- [x] **Landing Page**: Public hero, value strip, curated destinations load without authentication.
- [x] **Registration Flow**:
  - Step 1: Fill registration details.
  - Step 2: Receive 6-digit OTP code via email & enter code in 6-digit auto-advancing input.
  - Verification activates traveler account and logs in automatically.
- [x] **Traveler Dashboard**: Authenticated greeting, recent trips, KPI metrics.
- [x] **Trip Management**:
  - Create multi-city journey with dates and description.
  - Upload trip cover image via Cloudinary.
  - Add destination city stops and drag-and-drop / button reorder.
  - Schedule activities with categories, times, and estimated costs.
- [x] **Discovery**: Search Geoapify attractions with fallback catalog and bookmark experiences.
- [x] **Budget Analytics**: Inspect category donut charts and daily expenditure bars with Recharts.
- [x] **Timeline & Calendar**: View day-by-day itinerary in Timeline, Calendar grid, and List view.
- [x] **Public Sharing & Clone**:
  - Toggle trip public sharing & copy unique URL (`/public/trip/<slug>`).
  - Open public link incognito and clone trip into another traveler account with all stops and expenses duplicated.
- [x] **Profile & Avatar**: Upload custom avatar photo via Cloudinary and customize currency/airport.
- [x] **Admin Analytics Portal**: Accessible by admins only; forbidden for standard travelers.
- [x] **Direct Route Refreshes**: Directly accessing `/dashboard`, `/trips/1`, `/discover` resolves correctly via Vercel rewrite rules.
