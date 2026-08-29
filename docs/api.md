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

## Notes
This documentation is intentionally high-level for the bootstrap phase. Concrete endpoint definitions will be added as features are implemented.
