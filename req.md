# req.md: Disaster Management & Emergency Response Platform (MERN)

> Hand this file to Antigravity together with `design.md` and `.env.example`.
> Build the project exactly as described. Where something is ambiguous, choose the simplest working option and leave a short comment explaining the choice.

---

## 1. Project Overview

A real-time, centralized emergency-response platform. Survivors raise requests for help. Verified volunteers, NGOs, shelters and resource providers respond. Admins verify users and run the whole network from a command center.

The platform connects people in need to the **right responder, resource, shelter or organization** based on **location, urgency, availability and verification**.

**Stack:** MongoDB, Express.js, React (Vite), Node.js, Tailwind CSS, Socket.io, Leaflet (OpenStreetMap), Recharts, JWT + bcrypt.

---

## 2. User Roles

| Role | Main responsibility |
|---|---|
| Survivor | Report emergencies, request help, track requests |
| Volunteer | Accept and complete emergency tasks |
| NGO | Manage resources, requests and distribution |
| Shelter | Manage capacity, occupancy and facilities |
| Resource Provider | Manage and supply emergency resources |
| Admin | Verify users, monitor and control the whole network |

Survivors are active immediately after sign-up. Volunteers, NGOs, Shelters and Resource Providers must be **verified by an admin** before getting trusted status and access to responder features.

---

## 3. Functional Requirements

### 3.1 Emergency Request System (core)
- Survivor creates a request with: category, number of people affected, priority, GPS location (auto-detect + manual pin), description, photos/videos, timestamp, status, assigned responder.
- **Categories:** Food, Water, Medicine, Shelter, Rescue, Transport, Medical Assistance, Clothing, Emergency Supplies, Other.
- **Priority:** Critical, High, Medium, Low.
- **Lifecycle:** `Submitted → Verified → Assigned → In Progress → Delivered → Resolved` (also `Cancelled`, `Rejected`).
- Every status change is stored in a history log with who changed it and when.
- Survivors can edit or cancel a request only before it is assigned.

### 3.2 Location-Based Response
- Store all locations as GeoJSON `Point` with a `2dsphere` index.
- Use MongoDB `$geoNear` / `$near` to find nearby volunteers, NGOs, shelters and resources.
- Calculate and show distance between responder and survivor.
- Example: Medicine request → find verified volunteers/NGOs with medicine stock nearby → recommend the closest suitable one.

### 3.3 Interactive Emergency Map
- Central map built with Leaflet + OpenStreetMap.
- Marker types and colors: Critical requests (red), High requests (orange), Available volunteers (green), NGOs (blue), Shelters (purple), Resources (yellow).
- Filters: request type, priority, status, distance, volunteers, shelters, resources, NGOs.
- Clicking a marker opens a small detail card with an action button.
- Marker clustering when zoomed out. Live marker updates through Socket.io.

### 3.4 Intelligent Resource Assignment
Score every candidate resource using **Urgency + Distance + Quantity + Availability**. Weights come from `.env`.

Example:

```
Request: Medicine, Critical, 20 units needed, 4 km away
NGO A: 50 units, 2 km  -> Best Match (enough stock, closest)
NGO B: 100 units, 8 km
NGO C: 15 units, 1 km  -> not enough stock
```

- A candidate with insufficient quantity is penalized or excluded (partial fulfilment can be shown as an option).
- Return the top N matches with a score and a plain-language reason ("Has 50 units, 2 km away").
- Admin / NGO can accept the recommendation with one click or pick another manually.

### 3.5 Volunteer Matching System
Match requests to volunteers using: location, priority, skills, availability, service radius, current workload.

Example: Medical Assistance + Critical, volunteer with First Aid skill, 2.4 km away, available → high-quality match.

- Volunteers only see requests inside their service radius that fit their skills.
- Volunteers cannot exceed `VOLUNTEER_MAX_ACTIVE_TASKS`.
- Show a match label (Great / Good / Possible) rather than a raw number.

### 3.6 Role-Based Authentication
- Register, login, logout, refresh token, forgot password, reset password, email verification.
- JWT access token + refresh token, passwords hashed with bcrypt.
- Account lock after repeated failed logins.
- Protected frontend routes and protected backend routes. A survivor must never reach admin functionality by editing a URL, and the **backend must enforce this**, not only the UI.
- Redirect each role to its own dashboard after login.

### 3.7 User Verification System
- Volunteer: identity document, skills, experience, availability, service radius.
- NGO: organization details, registration documents, contact information.
- Shelter: shelter details, capacity, facilities, location, supporting documents.
- Resource Provider: business/organization details, documents, contact.
- Admin flow: `Pending → In Review → Approved / Rejected` with an optional rejection reason.
- Verified users get a "Verified" badge. Unverified responders cannot accept tasks, appear on the public map as available, or receive assignments.

### 3.8 Shelter Management
- Dashboard: total capacity, current occupancy, available spaces, facilities, location, availability status.
- Update occupancy (+/- buttons and direct input). Status auto-changes: Available, Almost Full, Full.
- Facilities: Food, Water, Medical, Washrooms, Electricity, Bedding, Accessibility, Pet-friendly.
- Example: capacity 500, occupied 372, available 128.

### 3.9 Resource & Inventory Management
- Fields: name, category, quantity, unit, location, availability, expiry date, provider, last updated.
- Alert states: Available (green), Low stock (red), Expiring soon (orange), Expired (red).
- A scheduled job (node-cron) checks stock and expiry and creates notifications.
- CRUD, search and filter, and a history of stock changes.

### 3.10 Admin Command Center
- Live KPI cards: Active Emergencies, Active Volunteers, Verified NGOs, Available Shelters, Available Resources, Pending Requests, Resolved Requests, Critical Requests.
- Manage: users, requests, volunteers, NGOs, shelters, resources, verification queue, reports, activity log.
- Block / unblock users. Manually reassign any request.

### 3.11 Real-Time Request Tracking
- Timeline for every request: Submitted → Verified → Assigned → In Progress → Delivered → Resolved.
- Show assigned responder, responder contact, current status, estimated progress, full history.
- Updates push live through Socket.io (no manual refresh).

### 3.12 Real-Time Notifications
- In-app notification bell with unread count, mark as read, mark all as read.
- **Survivor:** request submitted, verified, volunteer assigned, task started, completed, shelter availability.
- **Volunteer:** new nearby request, task assigned, request cancelled, priority changed.
- **NGO:** new resource request, low-stock alert, assignment received.
- **Admin:** new verification request, critical emergency, system alerts.
- Critical alerts can optionally be sent by email (and SMS if enabled).

### 3.13 Volunteer Task Management
- Task page after accepting a request: survivor location, navigation link/route, contact survivor, update status, report an issue, mark completed.
- Task status: `Accepted → On the Way → Arrived → Assistance Provided → Completed`.
- Volunteer can decline a task with a reason, and the request returns to the pool.

### 3.14 Analytics & Disaster Intelligence
- Requests by category, requests by location, critical vs normal, average response time, completed requests, volunteer activity, resource distribution, shelter occupancy, people helped.
- Charts with Recharts. Date-range filter.

### 3.15 Security & Access Control
- JWT auth middleware and role authorization middleware.
- bcrypt password hashing.
- Input validation on every route (express-validator or Zod).
- File upload validation (type, size, count).
- Helmet, CORS whitelist, express-mongo-sanitize, rate limiting (stricter on auth and SOS routes).
- Environment variables only through `.env`. No secrets in code or in the client.
- Consistent error responses. Never leak stack traces in production.

### 3.16 Emergency Media Upload
- Photos and videos on requests (e.g. flooded road, damaged house).
- Validate type and size, upload to Cloudinary (or local in dev), store only URLs in MongoDB.
- Preview before upload, and remove before submit.

### 3.17 SOS / Emergency Contact
- Big, always-visible SOS button on the survivor dashboard and navbar.
- Quick actions: create emergency request, request rescue, find nearest shelter, find medical help, view emergency map.
- **SOS flow must take 3 taps or fewer**: auto-detect location, choose what you need, send. Everything else is optional.
- Show the national emergency helpline number from `VITE_EMERGENCY_HELPLINE`.

### 3.18 Search & Filtering
- **Requests:** category, priority, status, location, date, assigned/unassigned.
- **Volunteers:** skills, availability, distance, verification.
- **Resources:** category, quantity, location, expiry, availability.
- **Shelters:** distance, capacity, facilities, availability.
- Server-side pagination, sorting and text search on all lists.

---

## 4. Pages (19)

| # | Module | Page | Route |
|---|---|---|---|
| 1 | Public | Landing / Home | `/` |
| 2 | Public | Login | `/login` |
| 3 | Public | Registration | `/register` |
| 4 | Survivor | Survivor Dashboard | `/survivor` |
| 5 | Survivor | Create Request | `/survivor/request/new` |
| 6 | Survivor | My Requests | `/survivor/requests` |
| 7 | Survivor | Request Tracking | `/survivor/requests/:id` |
| 8 | Survivor | Emergency Map | `/map` |
| 9 | Survivor | Notifications | `/notifications` |
| 10 | Volunteer | Volunteer Dashboard | `/volunteer` |
| 11 | Volunteer | Nearby Requests | `/volunteer/nearby` |
| 12 | Volunteer | Volunteer Task | `/volunteer/tasks/:id` |
| 13 | Volunteer | Volunteer Profile | `/volunteer/profile` |
| 14 | NGO / Resource | NGO Dashboard | `/ngo` |
| 15 | NGO / Resource | Resource Management | `/ngo/resources` |
| 16 | NGO / Resource | Resource Assignment | `/ngo/assignments` |
| 17 | Shelter | Shelter Dashboard | `/shelter` |
| 18 | Shelter | Shelter Map | `/shelter/map` |
| 19 | Admin | Admin Command Center | `/admin` |

Extra admin sub-views (users, verification queue, reports) can live as tabs inside the Command Center.

---

## 5. Database (MongoDB / Mongoose)

Collections:

`Users`, `Requests`, `Volunteers`, `NGOs`, `Shelters`, `Resources`, `Assignments`, `Notifications`, `VerificationDocuments`, `TaskHistory`

Key rules:
- `Users` hold auth data and role. Role-specific profiles (`Volunteers`, `NGOs`, `Shelters`) reference `Users`.
- Every location field is GeoJSON `{ type: "Point", coordinates: [lng, lat] }` with a `2dsphere` index.
- `Requests` store `statusHistory[]`, `media[]`, `priority`, `category`, `peopleAffected`, `assignedTo`.
- Add indexes on `status`, `priority`, `category`, `createdAt`, and `role`.
- Use timestamps on every schema.
- Provide a seed script: 1 admin, sample volunteers, NGOs, shelters, resources and requests around the default map centre.

---

## 6. API Structure (REST, prefix `/api/v1`)

| Area | Examples |
|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password/:token`, `GET /auth/me` |
| Requests | `POST /requests`, `GET /requests`, `GET /requests/:id`, `PATCH /requests/:id/status`, `PATCH /requests/:id/cancel`, `GET /requests/:id/matches` |
| Volunteers | `GET /volunteers/nearby-requests`, `POST /volunteers/tasks/:id/accept`, `PATCH /volunteers/tasks/:id/status`, `PATCH /volunteers/availability` |
| Resources | CRUD at `/resources`, `GET /resources/alerts`, `POST /resources/:id/assign` |
| Shelters | CRUD at `/shelters`, `PATCH /shelters/:id/occupancy`, `GET /shelters/nearby` |
| Map | `GET /map/entities?lat&lng&radius&types=...` |
| Verification | `POST /verification/submit`, `GET /admin/verifications`, `PATCH /admin/verifications/:id` |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` |
| Admin | `GET /admin/stats`, `GET /admin/users`, `PATCH /admin/users/:id/block`, `GET /admin/analytics` |

All responses use one shape: `{ success, message, data }`, errors: `{ success: false, message, errors? }`.

---

## 7. Project Structure

```
disaster-platform/
├── client/                  # React + Vite + Tailwind
│   └── src/
│       ├── api/             # axios instance + endpoint helpers
│       ├── components/      # shared UI (Button, Card, Badge, Timeline, MapView...)
│       ├── context/         # AuthContext, SocketContext, NotificationContext
│       ├── hooks/
│       ├── layouts/         # PublicLayout, DashboardLayout
│       ├── pages/           # grouped by role
│       ├── routes/          # ProtectedRoute, RoleRoute
│       └── utils/
├── server/
│   └── src/
│       ├── config/          # db, env, cloudinary, socket
│       ├── controllers/
│       ├── middleware/      # auth, role, validate, upload, error, rateLimit
│       ├── models/
│       ├── routes/
│       ├── services/        # matchingService, notificationService, inventoryJob
│       ├── sockets/
│       ├── utils/
│       ├── seed/
│       └── server.js
├── .env.example
├── req.md
└── design.md
```

---

## 8. Non-Functional Requirements

- **Speed first:** the SOS flow loads fast and works on slow 3G.
- **Responsive:** fully usable on phones (most survivors will be on mobile) up to desktop.
- **Reliability:** if the network drops, the SOS form keeps the draft locally and retries sending.
- **Accessibility:** WCAG AA contrast, keyboard navigable, visible focus, labels on all inputs.
- **Clean code:** modular, commented where logic is non-obvious, consistent naming, no dead code.
- **Error handling:** friendly messages for users, detailed logs for developers.
- **Pagination** on all list endpoints.

---

## 9. Build Order (follow this sequence)

1. Project setup, folder structure, env loading, DB connection.
2. Auth (register, login, JWT, roles, middleware) + protected routes.
3. Verification system + admin approval queue.
4. Emergency requests + lifecycle + media upload.
5. Location services + GeoJSON queries.
6. Matching engine (volunteers and resources).
7. Volunteer task flow.
8. Resource inventory + alerts job.
9. Shelter management.
10. Emergency map.
11. Socket.io real-time tracking and notifications.
12. Admin command center + analytics.
13. Seed data, polish, security pass, README.

---

## 10. Acceptance Checklist

- [ ] All 6 roles can register, log in and land on the correct dashboard.
- [ ] A survivor calling an admin API directly gets `403`.
- [ ] Unverified responders cannot accept tasks.
- [ ] A request moves through the full lifecycle and every step is visible live to the survivor.
- [ ] Resource matching returns the expected best match in the NGO A / B / C example.
- [ ] Volunteer matching respects skills, radius and workload.
- [ ] Map shows all six marker types with working filters.
- [ ] Low-stock, expiring and expired alerts fire correctly.
- [ ] Notifications arrive in real time per role.
- [ ] Upload validation rejects wrong type or oversized files.
- [ ] Admin dashboard KPIs and charts reflect real data.
- [ ] SOS request can be sent in 3 taps or fewer.
- [ ] App works on a 360px-wide phone screen.
- [ ] No secrets committed; `.env.example` is complete.

---

## 11. What to Highlight in the Final Presentation

1. Emergency request management with a full lifecycle
2. Location-based response (GPS + map)
3. Intelligent matching (priority, distance, skills, availability, quantity)
4. Central emergency map
5. Multi-role ecosystem: Survivor ↔ Volunteer ↔ NGO ↔ Shelter ↔ Admin
6. Verified, role-based trust system
7. Real-time resource management
8. Live shelter capacity
9. Real-time tracking
10. Real-time notifications
11. Admin command center
12. Disaster analytics

The pages are only the interface. The system behind them is the project.
