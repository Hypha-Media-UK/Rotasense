# Staff Scheduling System - Project Reference

## Core Requirements

### Technology Stack
- **Frontend**: Vue 3 + Vite + TypeScript + Pinia
- **Backend**: Express.js + Prisma + MySQL
- **Styling**: Modern CSS (Grid, Subgrid, Container Queries, Cascade Layers, OKLCH colors)
- **Time Management**: date-fns
- **Validation**: Zod
- **Deployment**: Docker + OrbStack locally, Plesk for production
- **Mobile**: Optimized for mobile devices

### Two Main Screens

#### 1. Config Screen (Tabs)
- **Locations**: Buildings → Departments
- **Services**: Create/edit services
- **Staff**: Regular/Relief/Supervisors (sub-tabs)
- **Shift Types**: 4-on/4-off, Weekdays, Weekends with zero start date & offset
- **Settings**: 24hr/12hr time display (default: 24hr)

#### 2. Home Screen
- Display departments and services (not buildings)
- Week navigation (Monday-Sunday)
- Day sub-navigation
- Staff listings with allocations
- Temporary re-allocations (daily only)
- Absence management
- Understaffed indicators

### Key Business Logic

#### Staff Rules
- Default: 12 hours, 08:00-20:00
- Can be allocated to multiple departments/services (no time conflicts)
- Relief staff: separate list, can work anywhere
- Categories: Regular, Relief, Supervisors

#### Department/Service Rules
- Operational days and times
- Minimum staff requirements (granular time periods)
- Display only if operational AND has staff OR marked to display

#### Shift Types
- Zero start date + offset for rotation groups
- Can display as department on homepage
- 4-on/4-off example: alternating groups

#### Understaffing Logic
- Staff contracted hours vs department operational hours
- Absence periods affect staffing
- Automatic "Off Duty" if hours don't match

#### Time Conflict Detection
Simple rule: `newStart < existingEnd && newEnd > existingStart`

### Database Schema (Simple)
```
staff (id, name, category, default_start_time, default_end_time)
buildings (id, name)
departments (id, name, building_id, operational_days, start_time, end_time, min_staff)
services (id, name, operational_days, start_time, end_time, min_staff)
staff_allocations (staff_id, department_id/service_id, days_of_week)
daily_overrides (date, staff_id, new_allocation, absence_start, absence_end)
shift_types (id, name, days_on, days_off, zero_start_date, offset, display_on_homepage)
```

### Design Principles
- Clean HTML, avoid over-nesting
- No iconography
- Minimal colors
- Mobile-optimized
- Inspired by: https://app.augmentcode.com/account/subscription
- DRY principles
- Modular components

### Initial Data
**Staff**: 75+ names provided (AJ, Alan Clark, Alan Kelly, etc.)
**Buildings**: Hartshead, Ladysmith, Macmillan Unit, Charlesworth
**Departments**: 30+ departments across buildings

### Anti-Patterns to Avoid
- Over-engineering time conflict detection
- Complex state management (max 2 Pinia stores)
- Performance optimizations before needed
- Mixing REST and tRPC
- Complex database schemas

### Development Phases
1. Project setup + basic structure
2. Config screen (forms and tables)
3. Basic homepage with static data
4. Date navigation
5. Temporary allocations and absences
6. Mobile optimization
7. Polish and testing

## Key Mantras
- **Keep it simple**
- **Build it, make it work, then optimize**
- **The complexity is in UX, not architecture**
- **Mobile-first approach**
