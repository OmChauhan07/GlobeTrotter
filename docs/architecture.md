# GlobeTrotter Architecture

## Overview
GlobeTrotter is a multi-city travel planning platform that helps travelers organize trips, budgets, activities, and shared plans across destinations.

## Planned System Layout
- Frontend: React + Vite single-page application for the user experience
- Backend: Django REST API for business logic, authentication, and persistence
- Database: PostgreSQL for transactional data and relational modeling

## Core Components
- User accounts and authentication
- Trip lifecycle management
- Destination and activity planning
- Expense tracking and shared cost allocation
- Analytics and reporting
- Sharing and collaboration features

## Communication Flow
1. Users interact with the frontend application.
2. The frontend calls Django REST API endpoints.
3. Django services and model logic handle validation and persistence.
4. Data is stored in PostgreSQL and returned through the API.

## High-Level Goals
- Keep the frontend lightweight and responsive.
- Use a clear REST API contract for frontend/backend integration.
- Support future scalability with modular Django apps.
