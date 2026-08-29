# GlobeTrotter Database Design

## Planned Database
The project is planned to use PostgreSQL as the primary relational database.

## Core Entities
- Users
- Trips
- Destinations
- Activities
- Expenses
- Sharing records
- Analytics aggregates

## Design Principles
- Use normalized relational tables for core entities.
- Keep user and trip ownership clear across all domain models.
- Model shared records as explicit relationships rather than duplicating data.
- Use foreign keys and indexes to support travel-specific query patterns.

## Notes
This file reflects the planned architecture for Phase 1 bootstrapping. Detailed schema definitions will be added as the application modules are implemented.
