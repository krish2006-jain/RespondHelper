# implementation.md: Disaster Management & Emergency Response Platform Implementation Plan

## 1. Executive Summary & Architecture Overview

The **Disaster Management & Emergency Response Platform** (Relief Network) is an enterprise-grade, real-time MERN platform designed for crisis coordination across 6 distinct user roles: **Survivor, Volunteer, NGO, Shelter Manager, Resource Provider, and System Administrator**.

### High-Level Tech Stack
- **Backend**: Node.js, Express.js (REST API prefix `/api/v1`), Socket.io (real-time events), Mongoose / MongoDB (with `2dsphere` spatial indexing), JWT (`jsonwebtoken`) + `bcryptjs`, `multer` (file handling with local disk fallback + optional Cloudinary), `node-cron` (inventory stock & expiry alerts), `express-validator` & `helmet` & `cors` & `express-rate-limit`.
- **Frontend**: React 18 / 19 with Vite, Tailwind CSS (custom design system based on `design.md`), Lucide React icons, Leaflet & React-Leaflet (OpenStreetMap with custom color-coded & shaped SVG markers, marker clustering), Recharts (Disaster Analytics), Axios (API client with interceptors for token auto-refresh), Socket.io-client.
- **Styling & UX Guidelines**: Strict adherence to `design.md` — Calm, Trustworthy, Reliable. Palette featuring Deep Teal (`#0F5C5C`), Amber (`#E8A33D`), Urgency Red (`#C8352B`), Warm Off-White (`#FAF7F2`), Plus Jakarta Sans / Inter typography, 3-tap SOS workflow, local draft persistence, responsive mobile-first navigation.

---

## 2. Directory Structure

```
d:/RespondHelper/
├── client/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env
│   └── src/
│       ├── api/
│       │   ├── client.js             # Axios instance with auth interceptor & refresh token queue
│       │   ├── auth.js               # Auth endpoints (login, register, logout, me, refresh)
│       │   ├── requests.js           # Emergency requests, matching & lifecycle endpoints
│       │   ├── volunteers.js         # Nearby tasks, task acceptance, status stepper
│       │   ├── resources.js          # Resource inventory CRUD, stock alerts, assignments
│       │   ├── shelters.js           # Shelter CRUD, occupancy updates
│       │   ├── map.js                # Geo-spatial entity fetching
│       │   ├── admin.js              # User verification, analytics, KPI stats
│       │   └── notifications.js      # Fetch notifications, mark read/read-all
│       ├── components/
│       │   ├── common/               # Button, Input, Modal, Badge, Card, StatCard, Toast, Skeleton, Tabs
│       │   ├── layout/               # Navbar, Sidebar, BottomNav (mobile), Header, Footer
│       │   ├── map/                  # Leaflet MapView, CustomMarkers, MarkerCluster, RadiusCircle, LocateControl
│       │   ├── emergency/            # SOSModal, QuickSOSButton, RequestTimeline, EmergencyMediaUploader
│       │   └── matching/             # RecommendationCard, MatchScoreBadge, ResourceRanker
│       ├── context/
│       │   ├── AuthContext.jsx       # User auth state, role verification status, logout
│       │   ├── SocketContext.jsx     # Socket.io connection, room subscriptions
│       │   ├── NotificationContext.jsx # Live toast & notification drawer state
│       │   └── EmergencyDraftContext.jsx # Offline local-storage auto-save for SOS forms
│       ├── hooks/
│       │   ├── useGeolocation.js     # Browser GPS auto-detection with error fallback
│       │   ├── useDebounce.js
│       │   └── useSocketEvent.js
│       ├── layouts/
│       │   ├── PublicLayout.jsx      # Clean navbar & footer for landing, login, register
│       │   └── DashboardLayout.jsx   # Role-based sidebar, top search/alerts bar, mobile bottom bar
│       ├── pages/
│       │   ├── public/               # LandingPage, LoginPage, RegisterPage, ForgotPasswordPage
│       │   ├── survivor/             # SurvivorDashboard, CreateRequestPage, MyRequestsPage, RequestDetailPage
│       │   ├── volunteer/            # VolunteerDashboard, NearbyRequestsPage, VolunteerTaskPage, VolunteerProfilePage
│       │   ├── ngo/                  # NGODashboard, ResourceManagementPage, ResourceAssignmentPage
│       │   ├── shelter/              # ShelterDashboard, ShelterMapPage
│       │   ├── admin/                # AdminDashboard (KPIs, Users, Verifications, Reassignments, Analytics)
│       │   ├── shared/               # CentralEmergencyMapPage, NotificationsPage, NotFoundPage
│       ├── routes/
│       │   ├── AppRoutes.jsx         # React Router v6 setup
│       │   ├── ProtectedRoute.jsx    # Auth & verification gating
│       │   └── RoleRoute.jsx         # Role-specific route firewall
│       └── utils/
│           ├── formatters.js         # Distance (km), time relative (date-fns or custom), status badges
│           ├── constants.js          # Categories, Priorities, Roles, Statuses, Helplines
│           └── leafletIcons.js       # SVG custom colored & shaped pin icons
├── server/
│   ├── package.json
│   ├── .env
│   └── src/
│       ├── config/
│       │   ├── db.js                 # Mongoose connection with retry & 2dsphere index initialization
│       │   ├── env.js                # Validated environment config with defaults
│       │   ├── socket.js             # Socket.io server initialization and room handlers
│       │   └── cloudinary.js         # Optional Cloudinary / Local Multer fallback setup
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── requestController.js
│       │   ├── volunteerController.js
│       │   ├── resourceController.js
│       │   ├── shelterController.js
│       │   ├── mapController.js
│       │   ├── verificationController.js
│       │   ├── notificationController.js
│       │   └── adminController.js
│       ├── middleware/
│       │   ├── authMiddleware.js     # JWT token verification
│       │   ├── roleMiddleware.js     # Role firewall & verification check
│       │   ├── validateMiddleware.js # Input sanitization & express-validator
│       │   ├── uploadMiddleware.js   # Multer file filter (type, size, count)
│       │   ├── rateLimitMiddleware.js# Standard, Auth, and SOS rate limiters
│       │   └── errorMiddleware.js    # Standardized JSON error response handler
│       ├── models/
│       │   ├── User.js               # Core auth, role, verification status, failedLogins
│       │   ├── VolunteerProfile.js   # Skills, availability, serviceRadius, activeTaskCount, coordinates
│       │   ├── NGOProfile.js         # Org name, registrationNo, coordinates, contact
│       │   ├── Shelter.js            # Capacity, occupancy, facilities, coordinates, status
│       │   ├── Resource.js           # Category, quantity, unit, expiryDate, providerId, coordinates
│       │   ├── Request.js            # Category, priority, peopleAffected, coordinates, status, history, assignedTo
│       │   ├── Assignment.js         # Resource / Volunteer assignment records
│       │   ├── Notification.js       # In-app notifications per user/role
│       │   ├── VerificationDocument.js # Responders' uploaded proofs
│       │   └── TaskHistory.js        # Audit trail of status transitions
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── requestRoutes.js
│       │   ├── volunteerRoutes.js
│       │   ├── resourceRoutes.js
│       │   ├── shelterRoutes.js
│       │   ├── mapRoutes.js
│       │   ├── verificationRoutes.js
│       │   ├── notificationRoutes.js
│       │   └── adminRoutes.js
│       ├── services/
│       │   ├── matchingEngine.js     # Intelligent weighted resource & volunteer matching algorithms
│       │   ├── notificationService.js# Real-time socket broadcast & DB notification dispatcher
│       │   └── inventoryJob.js       # node-cron task for low stock & expiration warnings
│       ├── utils/
│       │   ├── geoUtils.js           # Haversine distance calculator & bounding boxes
│       │   ├── apiResponse.js        # Standardized `{ success, message, data }` response helper
│       │   └── logger.js
│       ├── seed/
│       │   └── seedData.js           # Comprehensive Mumbai-area sample dataset & admin seeder
│       └── server.js                 # HTTP + WebSocket server entry point
├── .env                              # Root environment config (with MongoDB connection)
├── .env.example
├── req.md
├── design.md
└── implementation.md
```

---

## 3. Database Schema & Data Models

### 3.1 User & Auth (`User.js`)
- `name`: String, required
- `email`: String, required, unique, lowercase, indexed
- `phone`: String, required
- `password`: String, required (hashed with bcrypt salt rounds 12)
- `role`: Enum `['survivor', 'volunteer', 'ngo', 'shelter', 'resource_provider', 'admin']`
- `verificationStatus`: Enum `['pending', 'in_review', 'verified', 'rejected']` (default `verified` for survivor, `pending` for responders)
- `rejectionReason`: String
- `location`: GeoJSON Point `{ type: "Point", coordinates: [lng, lat] }` with `2dsphere` index
- `address`: String
- `failedLoginAttempts`: Number (default 0)
- `lockUntil`: Date
- `refreshToken`: String
- Timestamps: `createdAt`, `updatedAt`

### 3.2 Emergency Request (`Request.js`)
- `survivorId`: ObjectId ref `User`
- `title`: String
- `category`: Enum `['Food', 'Water', 'Medicine', 'Shelter', 'Rescue', 'Transport', 'Medical Assistance', 'Clothing', 'Emergency Supplies', 'Other']`
- `priority`: Enum `['Critical', 'High', 'Medium', 'Low']` (indexed)
- `peopleAffected`: Number (min 1)
- `location`: GeoJSON Point `{ type: "Point", coordinates: [lng, lat] }` with `2dsphere` index
- `address`: String
- `description`: String
- `media`: Array of `{ url: String, fileType: String, publicId: String }`
- `status`: Enum `['Submitted', 'Verified', 'Assigned', 'In Progress', 'Delivered', 'Resolved', 'Cancelled', 'Rejected']` (default `'Submitted'`, indexed)
- `assignedTo`: `{ responderId: ObjectId, responderModel: String, assignedAt: Date }`
- `statusHistory`: Array of `{ status: String, updatedBy: ObjectId, note: String, timestamp: Date }`
- `isSOS`: Boolean (flag for quick 3-tap SOS submissions)
- Timestamps: `createdAt`, `updatedAt`

### 3.3 Volunteer Profile (`VolunteerProfile.js`)
- `userId`: ObjectId ref `User`, unique
- `skills`: Array of Strings (`['First Aid', 'Search & Rescue', 'Medical Doctor', 'Boat Rescue', 'Food Distribution', 'Driving / Logistics', 'Counseling']`)
- `isAvailable`: Boolean (default `true`, toggled from dashboard)
- `serviceRadiusKm`: Number (default 25)
- `activeTaskCount`: Number (default 0, capped at `VOLUNTEER_MAX_ACTIVE_TASKS`)
- `currentTaskId`: ObjectId ref `Request`
- `experienceYears`: Number
- `idDocumentUrl`: String

### 3.4 NGO Profile (`NGOProfile.js`)
- `userId`: ObjectId ref `User`, unique
- `organizationName`: String, required
- `registrationNumber`: String, required
- `operatingSectors`: Array of Strings
- `coverageRadiusKm`: Number
- `warehouseLocations`: Array of GeoJSON Points
- `verificationDocs`: Array of Strings

### 3.5 Shelter (`Shelter.js`)
- `managerId`: ObjectId ref `User`
- `shelterName`: String, required
- `location`: GeoJSON Point with `2dsphere` index
- `address`: String
- `totalCapacity`: Number, required
- `currentOccupancy`: Number, default 0
- `availableSpaces`: Virtual/Calculated (`totalCapacity - currentOccupancy`)
- `status`: Enum `['Available', 'Almost Full', 'Full', 'Closed']` (auto-calculated: >=90% = Almost Full, 100% = Full)
- `facilities`: Array of Strings (`['Food', 'Water', 'Medical', 'Washrooms', 'Electricity', 'Bedding', 'Accessibility', 'Pet-friendly']`)
- `contactPhone`: String
- Timestamps

### 3.6 Resource & Inventory (`Resource.js`)
- `providerId`: ObjectId ref `User`
- `name`: String, required
- `category`: Enum `['Food', 'Water', 'Medicine', 'Clothing', 'Emergency Supplies', 'Equipment', 'Other']`
- `quantity`: Number, required
- `unit`: String (`'units'`, `'kg'`, `'litres'`, `'boxes'`, `'packets'`)
- `initialQuantity`: Number
- `location`: GeoJSON Point with `2dsphere` index
- `address`: String
- `expiryDate`: Date (optional)
- `alertStatus`: Enum `['Available', 'Low Stock', 'Expiring Soon', 'Expired']`
- `history`: Array of `{ change: Number, previousQty: Number, newQty: Number, reason: String, changedBy: ObjectId, date: Date }`
- Timestamps

### 3.7 Notification (`Notification.js`)
- `recipient`: ObjectId ref `User` (or `role` for role-wide broadcasts)
- `title`: String
- `message`: String
- `type`: Enum `['emergency', 'assignment', 'status_update', 'verification', 'inventory', 'system']`
- `priority`: Enum `['critical', 'high', 'normal']`
- `link`: String (target URL to navigate on click)
- `isRead`: Boolean (default `false`)
- `metadata`: Object
- Timestamps

---

## 4. Intelligent Matching Algorithm

### 4.1 Resource Matching Formulation
When an emergency request of category $C$, quantity $Q_{req}$, and priority $P$ occurs at coordinates $L_{req}$:
1. Filter Resources where `category == C` and `alertStatus != 'Expired'` within `MATCH_MAX_RADIUS_KM` using MongoDB `$geoNear`.
2. Compute components:
   - **Urgency Score ($S_{urg}$)**: Critical = 1.0, High = 0.75, Medium = 0.5, Low = 0.25.
   - **Distance Score ($S_{dist}$)**: $1 - \min(1.0, \frac{\text{distanceKm}}{R_{max}})$.
   - **Quantity Score ($S_{qty}$)**: If $Q_{stock} \ge Q_{req} \implies 1.0$; Else $\frac{Q_{stock}}{Q_{req}} \times 0.6$ (penalized).
   - **Availability Score ($S_{avail}$)**: 1.0 if Available, 0.5 if Low Stock.
3. Total Score:
   $$Score = w_{urg} \cdot S_{urg} + w_{dist} \cdot S_{dist} + w_{qty} \cdot S_{qty} + w_{avail} \cdot S_{avail}$$
4. Return Top $N$ ranked candidates with plain-text explanation: *"Has 50 units (exceeds 20 needed), 2.1 km away — Best Match"*.

### 4.2 Volunteer Matching Formulation
When matching requests to volunteers:
1. Filter verified volunteers where `isAvailable == true` and `activeTaskCount < VOLUNTEER_MAX_ACTIVE_TASKS` within volunteer's `serviceRadiusKm`.
2. Compute:
   - **Distance Score**: Closer volunteers score higher.
   - **Skill Match Score**: 1.0 if volunteer has relevant skill for category (e.g. "Medical Doctor" for "Medical Assistance", "Search & Rescue" for "Rescue"), else 0.4.
   - **Workload Score**: $1 - \frac{\text{activeTaskCount}}{\text{maxTasks}}$.
3. Categorize match into: **"Great Match"** ($\ge 0.8$), **"Good Match"** ($0.65 - 0.79$), **"Possible Match"** ($< 0.65$).

---

## 5. Real-Time Socket.io Architecture

- **Rooms**:
  - `user:<userId>`: Private alerts, status changes for requests raised or assigned.
  - `role:<roleName>`: Broadcasts (e.g., `role:admin` gets verification & critical requests; `role:volunteer` gets nearby emergencies).
  - `request:<requestId>`: Live chat/progress updates between Survivor and assigned Volunteer/NGO.
  - `map:live`: Live updates on new emergency pins, volunteer location shifts, shelter capacity updates.
- **Events**:
  - `request:created` -> Broadcast to nearby volunteers & admin dashboard
  - `request:status_changed` -> Emitted to survivor & request room
  - `volunteer:task_assigned` -> Emitted to assigned volunteer
  - `shelter:occupancy_changed` -> Emitted to map & survivor feeds
  - `resource:alert` -> Emitted to NGO & resource providers

---

## 6. Detailed 19-Page Frontend Implementation

1. **`/` Landing Page**: Emergency banner with 112 helpline, Primary hero with big red "I Need Help" SOS action + "Volunteer / Provide Aid" button, 3-step disaster response visual story, live stats counters, Leaflet preview map.
2. **`/login` Login Page**: Split-panel layout, role-aware login, email/password + demo quick-login buttons for rapid testing of all 6 roles.
3. **`/register` Register Page**: 3-step wizard with role selection (Survivor, Volunteer, NGO, Shelter, Resource Provider), verification document uploader for responder accounts.
4. **`/survivor` Survivor Dashboard**: Prominent pulsing SOS button, Quick Action tiles (Create Request, Find Shelter, Find Medical, View Map), Live Active Request cards with status pills.
5. **`/survivor/request/new` Create Request**: 3-tap emergency form, GPS auto-detect with interactive pin adjust, category icon grid, priority picker, media preview, local draft auto-save.
6. **`/survivor/requests` My Requests**: List of raised emergencies, filterable by Active/Resolved/Cancelled, cards showing status and assigned helper.
7. **`/survivor/requests/:id` Request Tracking**: Vertical step timeline, Assigned Volunteer contact details, route map, direct call button.
8. **`/map` Emergency Map**: Full-screen Leaflet view with 6 marker types (Critical, High, Volunteers, NGOs, Shelters, Resources), radius filter, category filter, responsive bottom sheet drawer on marker click.
9. **`/notifications` Notifications Page**: Grouped by Today / Earlier, mark all as read, click-to-navigate action.
10. **`/volunteer` Volunteer Dashboard**: Large Availability switch, Active Assigned Task card with one-tap status stepper, daily stats (tasks completed, people assisted).
11. **`/volunteer/nearby` Nearby Requests**: Geo-sorted emergency requests within radius with Match Score badge (Great/Good/Possible), Accept / Decline buttons.
12. **`/volunteer/tasks/:id` Volunteer Task Action Page**: Navigation directions to survivor, call button, status stepper (`Accepted -> On the Way -> Arrived -> Assistance Provided -> Completed`), report issue modal.
13. **`/volunteer/profile` Volunteer Profile**: Verification status badge, skill tags editor, service radius slider, completed task log.
14. **`/ngo` NGO Dashboard**: Inventory KPI strip (Total items, Low stock, Expiring), Open matching requests, Distribution summary.
15. **`/ngo/resources` Resource Management**: Interactive data table with search, category filter, stock status badges (Available/Low/Expiring/Expired), quick +/− quantity adjustments, Add Resource drawer.
16. **`/ngo/assignments` Resource Assignment**: Split view showing Unfulfilled Request on the left and Ranked Recommended Warehouses/Supplies on the right with single-click assign.
17. **`/shelter` Shelter Dashboard**: Circular/Linear Occupancy gauge (Capacity, Occupied, Vacant), quick +/− counter, facilities switches (Food, Water, Medical, Washrooms, Pet-friendly), status indicator.
18. **`/shelter/map` Shelter Map**: Map of the local shelter, surrounding requests requiring shelter, and nearby relief distribution points.
19. **`/admin` Admin Command Center**: 8 KPI Cards, Live Central Command Map, Verification Approvals Queue (with document preview & approve/reject reasons), Request Manager & manual reassignment, User Management & block controls, Analytics with Recharts (emergencies by category, response time, volunteer distribution).

---

## 7. Configuration & Environment Assessment (.env Analysis)

Let's review the required variables and their current status:

### MongoDB Connection:
The existing `.env` contains:
```env
DATABASE_USER=krish14_db_user
DATABASE_PASSWORD=5YIbTFaINz0mioJb
DATABASE_CONNECTION=mongodb+srv://<db_username>:5YIbTFaINz0mioJb@cluster0.xzchffl.mongodb.net/?appName=Cluster0
```
- We will configure the backend to automatically substitute `DATABASE_USER` into `<db_username>` or format `MONGO_URI=mongodb+srv://krish14_db_user:5YIbTFaINz0mioJb@cluster0.xzchffl.mongodb.net/disaster_platform?retryWrites=true&w=majority&appName=Cluster0`.

### Required vs Optional Variables:
| Variable | Status | Default / Fallback in Code |
|---|---|---|
| `MONGO_URI` | **Provided** via `.env` | Constructed from `DATABASE_CONNECTION` + `DATABASE_USER` + `DATABASE_PASSWORD` |
| `JWT_ACCESS_SECRET` | Auto-configured | Built-in secure fallback key if not set |
| `JWT_REFRESH_SECRET`| Auto-configured | Built-in secure fallback key if not set |
| `PORT` | Auto-configured | `5000` |
| `CLIENT_URL` | Auto-configured | `http://localhost:5173` |
| `UPLOAD_PROVIDER` | Auto-configured | `local` (Files stored safely in `server/uploads/` with URL serving; no Cloudinary account required unless user provides credentials) |
| `MAP_PROVIDER` | Auto-configured | `osm` (OpenStreetMap - Free, zero API key required, 100% reliable) |
| `SMS_ENABLED` | Optional | `false` (In-app notifications + UI alerts work out of the box) |
| `SMTP_HOST` / Email | Optional | Logged to console in development mode if SMTP credentials are not configured |
| `DEFAULT_MAP_LAT/LNG`| Auto-configured | `19.0760`, `72.8777` (Mumbai center, matching seed data) |

> **Conclusion on `.env`**: You do **NOT** need any paid external API keys or complex setups. The system is architected to work seamlessly with the provided MongoDB Atlas database, local file uploads, OpenStreetMap tiles, and JWT authentication out-of-the-box.

---

## 8. Step-by-Step Execution Plan

### Step 1: Backend Foundation & Database Connection
- Set up `server/package.json` with all dependencies (`express`, `mongoose`, `cors`, `helmet`, `socket.io`, `jsonwebtoken`, `bcryptjs`, `multer`, `node-cron`, `express-rate-limit`, `dotenv`).
- Implement database connection with MongoDB Atlas connection string resolver.
- Implement unified API response format `{ success, message, data }` and global error handling.

### Step 2: Mongoose Schemas & Spatial Indexing
- Build all 9 Mongoose models (`User`, `Request`, `VolunteerProfile`, `NGOProfile`, `Shelter`, `Resource`, `Assignment`, `Notification`, `TaskHistory`).
- Ensure `2dsphere` indexes on all location fields.

### Step 3: Authentication, Authorization & Verification
- Implement JWT access/refresh token logic, bcrypt hashing, account lock after repeated failed attempts.
- Implement `authMiddleware` and `roleMiddleware` enforcing backend-level role protection.
- Build responder verification workflow (Pending -> In Review -> Approved/Rejected).

### Step 4: Core Request & Matching Engine
- Implement Emergency Request CRUD, 3-tap SOS creation, status lifecycle state machine with history audit logs.
- Implement `matchingEngine.js` for weighted resource ranking and volunteer matching.
- Implement Volunteer Task workflow (`accept`, `update status`, `decline`).

### Step 5: Inventory, Shelters & Scheduled Jobs
- Resource inventory management with stock-level calculations and quick updates.
- Shelter capacity & occupancy management with real-time vacancy status.
- `node-cron` scheduled task for low stock & expiry warnings.

### Step 6: Socket.io Real-Time Event Hub
- Initialize Socket.io server with rooms for users, roles, and emergency tracking.
- Connect lifecycle changes, new requests, and occupancy updates to real-time socket emitters.

### Step 7: Frontend Architecture & Design System Setup
- Scaffold React + Vite application in `client/`.
- Configure Tailwind CSS with the full color palette from `design.md` (`primary: #0F5C5C`, `accent: #E8A33D`, `danger: #C8352B`, `bg: #FAF7F2`, etc.).
- Build reusable UI components (Button, Input, Card, Badge, StatCard, Modal, StatusTimeline, Toast, Skeletons).

### Step 8: Frontend Pages & Role Dashboards (19 Pages)
- Build public pages: Landing page (with SOS banner, story, live stats, map preview), Login (with role demo login switchers), Register (with responder verification upload).
- Build Survivor pages: Survivor Dashboard, 3-tap SOS / Create Request, My Requests, Request Tracking timeline.
- Build Volunteer pages: Volunteer Dashboard, Nearby Requests (with Match Score), Volunteer Task action page with status stepper, Volunteer Profile.
- Build NGO / Resource pages: NGO Dashboard, Resource Management with search/filters and quick stock adjustment, Resource Assignment split view.
- Build Shelter pages: Shelter Dashboard with occupancy meter, Shelter Map.
- Build Central Emergency Map (`/map`) with 6 distinct marker types, clustering, filters, and info sheet.
- Build Admin Command Center (`/admin`) with 8 KPI counters, live map, verification queue, request reassignment, and Recharts analytics.

### Step 9: Database Seeding & Comprehensive Testing
- Write and run `seedData.js` to populate Mumbai area with 1 Admin, realistic volunteers, NGOs, shelters, resources, and live emergency requests.
- Verify all role flows, API permissions, matching algorithms, socket notifications, and responsive views.

---
