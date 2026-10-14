# RespondHelper - Project Highlights & End-to-End Workflow

## Project Overview

RespondHelper is a real-time disaster management and emergency coordination platform that connects people in crisis with verified volunteers, NGOs, shelters, resource providers, and command-center administrators.

The platform is built on:

- **React & Tailwind CSS** for a responsive, real-time command dashboard
- **Node.js & Express** for the REST API backend
- **MongoDB & Mongoose** for document storage and geospatial queries (`2dsphere`)
- **JWT Authentication & Role-Based Access Control (RBAC)**
- **Socket.IO** for bi-directional live dispatch, tracking, and notification events
- **Intelligent Matching Engine** (Geodesic distance, required skill-matching, urgency scoring, workload capacity)

---

## User Roles & Responsibilities

| Role | Core Purpose | Key Capabilities |
| :--- | :--- | :--- |
| **Survivor** | Report emergencies & seek aid | One-click SOS, GPS location capture, live response tracker |
| **Volunteer** | Field rescue & immediate aid | Accept nearby tasks, update transit/arrival status, log people helped |
| **NGO Coordinator** | Relief supplies & aid logistics | Manage supply warehouses, allocate medicine/food, field assignments |
| **Shelter Manager** | Safe evacuation & housing | Maintain live bed capacity, manage facilities, log admissions |
| **Resource Provider** | Supply chain replenishment | Publish water, medicine, rations, and rescue gear inventory |
| **Command Center Admin** | Oversight, verification & dispatch | Verify responder credentials, reassign emergency requests from database, analyze response metrics |

## How All Roles Connect Together in an Emergency

In a real disaster, **a volunteer cannot solve an emergency alone**:
- A **Volunteer** provides *boots-on-the-ground* physical rescue and first aid.
- But volunteers cannot produce 50 meal packets, 100 litres of clean water, or specialized insulin out of thin air — those come from **NGO Warehouses**.
- And when a survivor's home is submerged or collapsed, the volunteer cannot take them home — the survivor must be evacuated to a **Shelter** with vacant beds, clean sanitation, and meals.
- Meanwhile, as NGOs dispatch supplies, **Resource Providers** replenish warehouse stock so aid doesn't run dry.
- The **Command Center Admin** oversees this entire web on a unified GIS dashboard.

```text
                             +-------------------------------+
                             |    1. SURVIVOR IN DISTRESS    |
                             |  Creates Critical SOS Request |
                             +---------------+---------------+
                                             |
                                             v
                      +---------------------------------------------+
                      |          RESPONDHELPER CENTRAL HUB          |
                      |          (Request ID: #6acf0...)            |
                      +------+---------------+---------------+------+
                             |               |               |
             +---------------+               |               +---------------+
             |                               |                               |
             v                               v                               v
+------------------------+      +------------------------+      +------------------------+
|      2. VOLUNTEER      |      |         3. NGO         |      |       4. SHELTER       |
|    (Field Responder)   |      |  (Supply Distributor)  |      |   (Evacuation Camp)    |
| • Navigates to GPS     |      | • Allocates 20L Water  |      | • Live Bed Occupancy   |
| • Performs First Aid   |      | • Dispatches Rations   |      | • Houses Evacuees      |
| • Delivers NGO Aid     |      | • Coordinates Logistics|      | • Provides Sanitation  |
+------------+-----------+      +------------+-----------+      +------------+-----------+
             |                               ^                               ^
             |                               |                               |
             |                   +-----------+-----------+                   |
             |                   |  5. RESOURCE PROVIDER |                   |
             |                   | • Replenishes Stock   |                   |
             |                   | • Restocks NGO Depots |                   |
             |                   +-----------------------+                   |
             |                                                               |
             +------------------- Hands over to Shelter ---------------------+
                                             |
                                             v
                             +-------------------------------+
                             |    6. COMMAND CENTER ADMIN    |
                             | Live Monitoring, Reassignment |
                             | & Citywide Disaster Analytics |
                             +-------------------------------+
```

---

## Technical Data Flow: How the Database Binds All Roles

| Step | Role | Technical Action | Database / Socket Update |
| :--- | :--- | :--- | :--- |
| **1. Report** | **Survivor** | Submits emergency SOS with GPS `[lng, lat]` | Inserts `Request` with `_id: #6acf0...` and `status: 'Submitted'`. Fires `emergency:new` socket. |
| **2. Dispatch** | **Admin / Matcher** | Dispatches nearest verified volunteer | Updates `Request.assignedTo` (`volunteerId`, `taskStatus: 'On the Way'`). Creates `Assignment` document. |
| **3. Supply Allocation**| **NGO Coordinator** | Allocates 25 meal packets & 10L clean water to `#6acf0...` | Decrements `Resource.quantity` in warehouse. Inserts `Assignment` linking `requestId`, `resourceId`, and `allocatedQuantity`. Fires `request:status_changed`. |
| **4. Restock** | **Resource Provider**| Restocks low-stock warehouses when alerts trigger | Updates `Resource.quantity` and resets `alertStatus: 'Available'`. |
| **5. Rescue & Transit**| **Volunteer** | Picks up allocated supplies, travels to survivor, provides aid | Advances mission stepper (`Accepted` $\rightarrow$ `On the Way` $\rightarrow$ `Arrived` $\rightarrow$ `Assistance Provided`). Updates `Request.assignedTo.taskStatus`. |
| **6. Evacuation** | **Shelter Manager** | Checks in survivor at nearest available shelter camp | Increments `Shelter.currentOccupancy`. Updates vacant bed count across the platform map. |
| **7. Resolution** | **Volunteer / Admin**| Marks mission completed | Sets `Request.status: 'Resolved'`. Increments volunteer `peopleHelpedCount` and updates Command Center analytics. |

---

## Detailed Step-by-Step Example

### Scenario: Medical Emergency During Urban Flooding in Mumbai

A survivor named **Rohan** is trapped in Kurla, Mumbai due to rising floodwaters. Rohan requires immediate medical assistance and insulin for a diabetic family member.

---

### Step 1: Survivor Creates SOS (Where does Request ID come from?)

1. Rohan opens RespondHelper on his phone and clicks **"Send Emergency SOS"**.
2. The browser grabs his precise GPS coordinates (`latitude: 19.0728, longitude: 72.8797`).
3. Rohan fills in the SOS form:
   - **Emergency Type**: `Medical Assistance`
   - **Priority**: `Critical`
   - **People Affected**: `3`
   - **Description**: `"Trapped on 1st floor, water level rising. Urgent insulin & first aid needed."`
   - **Address**: `"Kurla West, Near Station, Mumbai"`
4. When Rohan taps **Submit**, the frontend sends a `POST /api/requests` with his JWT token in the `Authorization: Bearer <token>` header.
5. **How the Request ID is generated**:
   - The backend reads Rohan's `User._id` from the verified JWT token (`req.user._id`).
   - MongoDB automatically creates a new `Request` document and generates a unique 24-character hexadecimal `_id` (e.g., `670bb1a29f8c12a4b8d71234`).
   - The document is saved with `status: 'Submitted'`.

```json
// Created MongoDB Document (Request: 670bb1a29f8c12a4b8d71234)
{
  "_id": "670bb1a29f8c12a4b8d71234",
  "survivorId": "670ba9913e2f55a1a1b10001", // Rohan's User ID
  "category": "Medical Assistance",
  "priority": "Critical",
  "title": "Trapped on 1st floor, water level rising",
  "location": {
    "type": "Point",
    "coordinates": [72.8797, 19.0728] // [lng, lat]
  },
  "address": "Kurla West, Near Station, Mumbai",
  "status": "Submitted",
  "assignedTo": null,
  "createdAt": "2026-10-14T10:15:00.000Z"
}
```

6. **Instant Broadcast**: The server immediately emits `emergency:new` through Socket.IO to the `admin` room and nearby active responders.

---

### Step 2: Emergency Appears on Admin Command Center

1. The Admin's dashboard receives the real-time socket event.
2. The emergency pulses on the **National Command Center Live Map** in red (`Critical`).
3. The Admin clicks the **"Requests & Reassign"** tab to view the live list of unassigned emergencies.
4. Rohan's request appears at the top:
   - **Category**: Medical Assistance | **Priority**: Critical
   - **Survivor**: Rohan (`+91 98765 43210`)
   - **Location**: Kurla West, Mumbai

---

### Step 3: Admin Assigns Responder (Where does Responder ID come from?)

#### Why manual typing of IDs was replaced:
- In early prototypes, assigning required an admin to open a browser prompt (`window.prompt('Enter Responder User ID')`) and manually copy-paste an obscure 24-character MongoDB ID string (`670ba...`). This was slow, error-prone, and unacceptable during a real disaster.
- **The Solution: Database-Driven Intelligent Assignment Modal**: The system fetches active, verified responders directly from MongoDB and calculates match scores automatically.

#### How it works now:
1. The Admin clicks **"Assign Responder →"** on Rohan's request.
2. The system executes two concurrent database queries:
   - `GET /api/requests/670bb1a29f8c12a4b8d71234/matches` -> Runs the **Intelligent Matching Engine**:
     - Calculates Haversine distance from Kurla (`[72.8797, 19.0728]`) to all verified volunteers.
     - Checks volunteer skills for `"First Aid"` or `"Medical Doctor"`.
     - Checks active task count (must be `< 2` to prevent volunteer fatigue).
     - Calculates composite match score:
       $$\text{Score} = (0.35 \times \text{Distance}) + (0.25 \times \text{Skill}) + (0.15 \times \text{Priority}) + (0.15 \times \text{Availability}) + (0.10 \times \text{Workload})$$
   - `GET /api/admin/responders` -> Queries the database for **all verified volunteers and NGOs**:
     - Fetches names, roles, phone numbers, verified badges, active task counts, and skills from `users` and `volunteerprofiles` collections in MongoDB.

3. **What the Admin sees in the UI**:
   - **Intelligent Recommendations**:
     - **Dr. Priya Sharma** (Volunteer) - `Great Match (92%)` • `1.8 km away` • Skills: *First Aid, Medical Doctor* • Phone: `+91 98200 11223`
     - **Amit Verma** (Volunteer) - `Good Match (78%)` • `3.2 km away` • Skills: *First Aid*
   - **Database Directory Selector**:
     - Filter by: `All`, `Volunteers`, `NGOs`
     - Live search box: search by name, phone number, or required skill
     - Full list of responders with real-time availability badges.

4. **One-Click Dispatch**:
   - The Admin clicks **"Assign This Match →"** next to Dr. Priya Sharma.
   - The client extracts Dr. Priya's database ID (`670ba9913e2f55a1a1b10002`) directly from the selected object.
   - **No manual ID typing is required**.

---

### Step 4: Backend Processes Assignment & Real-Time Dispatch

When the Admin confirms the selection, the client sends:
```http
POST /api/admin/requests/670bb1a29f8c12a4b8d71234/reassign
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "responderId": "670ba9913e2f55a1a1b10002"
}
```

The backend executes the following atomic operations:
1. **Update Request Status**:
   - Updates `status` to `'Assigned'`.
   - Embeds `assignedTo` snapshot:
     ```json
     "assignedTo": {
       "responderId": "670ba9913e2f55a1a1b10002",
       "responderRole": "volunteer",
       "responderName": "Dr. Priya Sharma",
       "responderPhone": "+91 98200 11223",
       "assignedAt": "2026-10-14T10:16:30.000Z"
     }
     ```
   - Appends to `statusHistory` audit log.
2. **Create Assignment Record**:
   - Inserts new document into `assignments` collection (`requestId`, `responderId`, `status: 'Assigned'`).
3. **Update Volunteer Workload**:
   - Increments `activeTaskCount` by `1` in `VolunteerProfile`.
4. **Trigger Notifications**:
   - Creates in-app Notification for Dr. Priya Sharma.
5. **Real-time Socket.IO Broadcasts**:
   - `io.to('user:670ba9913e2f55a1a1b10002').emit('task:assigned', { request })` -> Alerts Priya's phone.
   - `io.to('request:670bb1a29f8c12a4b8d71234').emit('request:status_changed', ...)` -> Rohan's live tracker updates immediately with Priya's name and phone number.

---

### Step 5: Volunteer Acts, Resource Provider Pickup & NGO Bulk Escalation

1. Dr. Priya's device buzzes with the high-priority task alert.
2. She taps the notification and views:
   - Survivor: Rohan (Kurla West)
   - Route map and turn-by-turn navigation
   - Urgency: Critical Medical
3. **Immediate Medicine Pickup (From Resource Provider)**:
   - On her active mission screen, Priya sees the nearest **Resource Provider Depot** (*Apex Supplies Depot, Parel*) with verified stock of insulin & trauma kits.
   - She picks up the required emergency medicine on the way to Rohan.
4. **Bulk Aid Escalation (If Needed for a Crowd)**:
   - Upon arriving in Kurla West, Priya discovers that not just Rohan, but **25 neighboring families** are stranded without drinking water and essential rations.
   - She taps **"Contact NGO for Bulk Aid"** on her mission screen:
     - The system immediately alerts **Sewa Relief Foundation (NGO Coordinator)**.
     - The NGO logs into the platform, opens **Match & Assign Supplies**, and requests wholesale stock from the **Resource Provider**.
     - The NGO dispatches 100 meal packets and 50L clean water directly to the Kurla relief point.
5. **Progress Updates**:
   - As Priya operates in the field, she updates the mission stepper:
     - `'Accepted'` $\rightarrow$ `'On the Way'` $\rightarrow$ `'Arrived'` $\rightarrow$ `'Assistance Provided'`
   - Rohan, the Command Center, and the NGO see live real-time status updates without refreshing.

---

### Step 6: Evacuation to Shelter & Request Resolution

1. **Evacuation Needed**:
   - Because floodwaters continue rising, Rohan's ground floor is completely submerged and uninhabitable.
2. **Admin Assigns Shelter / Volunteer Navigates to Camp**:
   - The Command Center Admin or Volunteer checks the **Live Shelter Network**.
   - **Shivaji Park Emergency Relief Camp** has 450 available beds with food, clean water, and sanitation.
   - Priya taps **"Evacuate"** to navigate Rohan and his family directly to the camp.
   - **Suresh Patil (Shelter Manager)** checks in Rohan and his family, admitting them and updating live camp occupancy.
3. **Final Resolution**:
   - Priya taps **"Mark Completed"** with the note: *"Emergency medical aid delivered; survivor and family evacuated safely to Shivaji Park Shelter Camp."*
   - Request status becomes `'Resolved'`.
   - Dr. Priya's `activeTaskCount` decrements to `0`, freeing her for new dispatches.
   - The Command Center analytics graphs reflect 3 more citizens safely rescued and sheltered.

---

## Entity Relationship & Identifier Flow

| Entity / Model | Identifier (`_id`) | Generated By | How It Connects |
| :--- | :--- | :--- | :--- |
| **User** | `User._id` | MongoDB on Signup | Root identity for Survivors, Volunteers, NGOs, Shelter Managers, Admins |
| **Request (SOS)** | `Request._id` | MongoDB on SOS Submission | Links to `survivorId` (`User._id`) and `assignedTo.responderId` (`User._id`) |
| **VolunteerProfile** | `VolunteerProfile._id` | MongoDB on Profile Creation | Foreign key `userId` points to `User._id`. Stores skills, location radius, active tasks |
| **Assignment** | `Assignment._id` | MongoDB on Admin Dispatch | Junction record linking `requestId` (`Request._id`) with `responderId` (`User._id`) |
| **Notification** | `Notification._id` | MongoDB on System Event | Targeted to `recipient` (`User._id`) with deep-link URL |

---

## Key Benefits of the Database-Driven Dispatch System

1. **Zero Manual ID Entry**: Admins never need to view, copy, or type MongoDB ObjectIds.
2. **Skill & Location Optimization**: Medical emergencies are prioritized for doctors/first responders; boat rescue emergencies are prioritized for rescue divers.
3. **Workload Protection**: Volunteers with high active task counts are automatically deranked to prevent responder burnout.
4. **End-to-End Visibility**: Survivors always have transparency into who is coming to help them, their contact number, and real-time status.
