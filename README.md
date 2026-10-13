# Disaster Management & Emergency Response Platform (Relief Network)

> A production-grade, full-stack real-time disaster management and emergency response coordination platform connecting survivors, volunteers, NGOs, relief shelters, resource providers, and administrators.

---

## 🌟 Key Highlights & Features

1. **Emergency Request Management & Full Lifecycle**
   - 3-tap rapid SOS dispatch with auto-detected GPS coordinates and offline draft auto-saving.
   - Lifecycle: `Submitted → Verified → Assigned → In Progress → Delivered → Resolved` (with full audit history).
2. **Interactive Central Emergency Map**
   - Built with **Leaflet + OpenStreetMap** (100% free, zero external API keys needed).
   - Custom color-coded and distinct shaped markers for Critical Emergencies (Red), High (Orange), Volunteers (Green), NGOs (Blue), Shelters (Purple), and Resource Depots (Yellow).
3. **Intelligent Matching Engine**
   - **Resource Matching**: Weighted formula scoring Urgency ($30\%$), Distance ($30\%$), Quantity Sufficiency ($25\%$), and Availability ($15\%$) with plain-language explanations.
   - **Volunteer Matching**: Proximity, skills alignment, priority, availability, and active workload caps.
4. **Live Shelter Capacity Management**
   - Visual bed capacity gauge, 1-click $+/-$ evacuee counter, facilities checklists, and automatic status transitions (`Available`, `Almost Full`, `Full`).
5. **Real-time Inventory & Stock Alerts**
   - Supply management with automated background hourly `node-cron` checks for low-stock ($<20\%$) and expiring/expired items.
6. **Admin Command Center & Disaster Analytics**
   - 8 live KPI counters, responder verification queue, user access control, manual request reassignment, and Recharts disaster intelligence graphs.
7. **Socket.io Real-Time Synchronization**
   - Live push updates for request status transitions, volunteer task notifications, and map entity changes without manual page refreshes.

---

## 🏗️ Tech Stack

- **Backend**: Node.js, Express.js (REST API `/api/v1`), Socket.io, MongoDB / Mongoose (GeoJSON with `2dsphere` spatial indexing), JWT + bcryptjs, Multer, node-cron.
- **Frontend**: React 18 with Vite, Tailwind CSS (Design tokens based on `design.md`), Lucide Icons, Leaflet & React-Leaflet, Recharts, Axios, Socket.io-client.

---

## 🚀 Quick Start & Running Locally

### 1. Backend Setup
```bash
cd server
npm install
npm run seed     # Seeds realistic Mumbai emergency dataset & demo accounts
node src/server.js # Starts backend on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev      # Starts frontend on http://localhost:5173
```

---

## 🔑 Pre-Seeded Demo Accounts (1-Click Login Available)

| Role | Email | Password | Primary Capabilities |
|---|---|---|---|
| **Command Center Admin** | `admin@relief.org` | `Admin@12345` | 8 KPIs, live command map, verification queue, reassignment, analytics |
| **Survivor** | `survivor@relief.org` | `Password@123` | 3-tap SOS, request creator, tracking timeline, shelter finder |
| **Volunteer (Dr. Rahul)** | `volunteer@relief.org` | `Password@123` | Availability switch, nearby missions with match score, task stepper, profile |
| **NGO (Sewa Foundation)** | `ngo@relief.org` | `Password@123` | Inventory catalog, quick $+/-$ stock edit, recommendation matcher & dispatch |
| **Shelter Manager** | `shelter@relief.org` | `Password@123` | Evacuee occupancy meter, quick check-in counter, facilities switches |
| **Resource Provider** | `provider@relief.org` | `Password@123` | Supplies depot management, medical kits & boat rescue equipment |

---

## 📑 19 Standardized Pages & Routes

1. Public:
   - `/`: Landing / Home
   - `/login`: Login (with 1-click role demo switchers)
   - `/register`: Multi-step Registration Wizard
2. Survivor:
   - `/survivor`: Survivor Dashboard
   - `/survivor/request/new`: Create Emergency Request / SOS
   - `/survivor/requests`: My Requests
   - `/survivor/requests/:id`: Live Request Tracking Timeline
3. Volunteer:
   - `/volunteer`: Volunteer Dashboard
   - `/volunteer/nearby`: Nearby Requests (with Match Score)
   - `/volunteer/tasks/:id`: Mission Action Page (GPS Nav & Stepper)
   - `/volunteer/profile`: Volunteer Profile (Skills & Radius)
4. NGO / Resource Provider:
   - `/ngo`: NGO Dashboard & Alerts
   - `/ngo/resources`: Resource Inventory Table
   - `/ngo/assignments`: Resource Recommendation & Dispatch Split-View
5. Shelter:
   - `/shelter`: Shelter Dashboard (Occupancy Meter)
   - `/shelter/map`: Shelter Operations Map
6. Admin & Shared:
   - `/admin`: Admin Command Center (8 KPIs, Verification Queue, Users, Reassignment, Analytics)
   - `/map`: Central Interactive Emergency Map
   - `/notifications`: Live Notification Center
