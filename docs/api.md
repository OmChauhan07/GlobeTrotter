# GlobeTrotter API Plan

## Overview
The backend exposes a REST API built with Django and Django REST Framework.

## Planned API Areas
- Accounts and authentication
- Trips
- Destinations
- Activities
- Expenses
- Sharing and collaboration
- Analytics

## API Namespace
The backend exposes API routes under /api/.

## Schema and Documentation
The foundation is configured with:
- /api/schema/
- /api/docs/
- /api/redoc/

These endpoints are provided by drf-spectacular and are designed as a starting point for REST API documentation in the project.

## API Design Goals
- Consistent resource-oriented endpoints
- Clear authentication and authorization boundaries
- JSON response contracts for frontend consumption
- Versioning-ready structure for future growth

## Trip and itinerary endpoints

### Trips
- `GET /api/trips/` — list the authenticated user's trips
- `POST /api/trips/` — create a trip for the authenticated user
- `GET /api/trips/<id>/` — retrieve one owned trip
- `PATCH /api/trips/<id>/` — update one owned trip
- `DELETE /api/trips/<id>/` — delete one owned trip

### Stops
- `POST /api/trips/<id>/stops/` — add a stop to a trip
- `PATCH /api/stops/<id>/` — edit stop dates or notes
- `DELETE /api/stops/<id>/` — delete a stop
- `PATCH /api/trips/<id>/reorder-stops/` — reorder trip stops via a dedicated ordering list

### Trip activities
- `POST /api/stops/<id>/activities/` — attach an activity to a stop
- `PATCH /api/trip-activities/<id>/` — edit a trip activity
- `DELETE /api/trip-activities/<id>/` — remove a trip activity
- `PATCH /api/stops/<id>/reorder-activities/` — reorder activities within one stop

### Security and validation
- All trip routes require authentication.
- Ownership is enforced server-side, so users can only access their own trips, stops, and activities.
- Invalid trip date ranges, stop date ranges, and time ranges return DRF validation errors with `400` responses.

## Notes
The trip API is now in place for secure CRUD and reordering within the authenticated user’s itinerary.
