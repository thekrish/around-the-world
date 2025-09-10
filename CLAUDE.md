# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An interactive travel journey mapping application built with Next.js 15 that visualizes personal travel experiences on a world map. Users can add trips, view animated journey paths, and manage travel memories with a comprehensive timeline interface.

## Commands

### Development
- `npm run dev` - Start development server with Turbopack enabled
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database
- `npx prisma generate` - Generate Prisma client after schema changes
- `npx prisma db push` - Push schema changes to SQLite database
- `npx prisma studio` - Open Prisma Studio for database browsing
- `npx prisma migrate dev` - Create and apply new migration
- `npx prisma db seed` - Run database seed script (if configured)

## Architecture

### Tech Stack
- **Next.js 15** with App Router and React Server Components
- **React 19** with hooks and modern patterns
- **TypeScript 5** with strict configuration
- **TailwindCSS v4** with `@theme inline` syntax
- **Prisma 6** ORM with SQLite database
- **Leaflet** with React Leaflet for interactive maps
- **Framer Motion** for animations and transitions

### Project Structure

**Core Application:**
- `/app` - Next.js App Router pages (layout.tsx, page.tsx)
- `/components` - Interactive React components for UI functionality
- `/prisma` - Database schema and SQLite database file

**Key Components:**
- `LeafletMap.tsx` - Main interactive world map with SSR handling via dynamic imports
- `TripCard.tsx` - Individual trip display with transport icons and trip details
- `AddTripModal.tsx` - Trip creation form with location and metadata input
- `TimelineControls.tsx` - Timeline navigation and trip filtering controls
- `AnimatedJourneyLine.tsx` - Animated path rendering for trip visualization

### Database Schema

**Core Models:**
- `Location` - Cities with coordinates, linked to trips via departure/arrival relations
- `Trip` - Central entity with type (ROUND_TRIP/ONE_WAY), dates, transport, and metadata
- `Traveler` - People who take trips, with color coding for UI representation
- `Attendee` - Trip participants with relationship context
- `Tag` - Trip categorization with visual colors

**Key Relationships:**
- Trip ↔ Location (many-to-one for both departure and arrival)
- Trip ↔ Traveler (many-to-many via implicit join table)
- Trip ↔ Attendee (many-to-many via implicit join table)
- Trip ↔ Tag (many-to-many via implicit join table)

**Enums:**
- `TripType`: ROUND_TRIP | ONE_WAY (affects map animation behavior)
- `Transport`: PLANE | CAR | TRAIN | BOAT | WALKING (with corresponding icons)

### Component Patterns

**SSR/Client Boundaries:**
- Leaflet components use dynamic imports with `ssr: false` to prevent hydration issues
- Map interactions are client-side only
- Server components handle initial data fetching

**State Management:**
- Local component state with React hooks (useState, useEffect)
- Props drilling for trip data and event handlers
- No external state management library currently

**Styling Approach:**
- TailwindCSS utility classes throughout
- Custom CSS variables in globals.css for theme colors
- Framer Motion for component animations and page transitions
- Responsive design with mobile-first approach

### Data Flow

1. **Trip Creation**: AddTripModal → validates input → creates Location records → creates Trip record
2. **Map Visualization**: Trip data → coordinate extraction → Leaflet markers/polylines → animated rendering
3. **Timeline Control**: TimelineControls → filters trips → updates active trip → triggers map animations

### Development Notes

- Database uses SQLite for simplicity (no external dependencies)
- All map-related imports must be dynamic to avoid SSR issues with Leaflet
- Trip ordering is managed via `order` field for timeline consistency
- Color theming is handled through Tailwind custom properties and database color fields
- Geospatial data uses standard latitude/longitude decimal degrees