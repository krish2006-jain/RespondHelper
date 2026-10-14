# RespondHelper Workflow

RespondHelper is a live, database-backed emergency coordination system. It includes six clearly labeled demo accounts for role testing; operational dashboards still use live database data.

## End-to-end flow

1. **Registration and verification** - A survivor, volunteer, NGO, shelter manager, or resource provider registers through the public form. Survivor and administrator accounts can operate immediately; other responder accounts are placed in the administrator verification queue.
2. **Emergency request** - A survivor submits an SOS/request with category, priority, description, location, and affected people. The request is stored in MongoDB and notifications are sent to relevant responders.
3. **Matching and assignment** - The matching engine considers location, skills, availability, workload, urgency, and resource stock. A volunteer, NGO, or administrator can accept or assign the request.
4. **Response tracking** - The assigned responder updates the request/assignment as work progresses. Socket.IO broadcasts relevant updates and the survivor can track the current status.
5. **Resolution** - The responder records completion, the request becomes resolved, and volunteer/task metrics and notifications are updated from persisted records.
6. **Network operations** - The command center combines live requests, users, verification documents, shelters, resources, and analytics. Shelter managers update occupancy/facilities; NGOs and resource providers maintain inventory; volunteers toggle availability and handle nearby tasks.

## Roles and permissions

| Role | Main responsibility | Typical data/actions |
| --- | --- | --- |
| Survivor | Report and follow an emergency | Create requests, view own requests, track assigned help |
| Volunteer | Provide field assistance | Maintain profile/availability, view matched requests, accept and update tasks |
| NGO Coordinator | Coordinate organized relief | Manage resources, receive requests, allocate supplies, monitor alerts |
| Shelter Manager | Operate an emergency shelter | Maintain capacity, occupancy, facilities, status, and contact details |
| Resource Provider | Contribute emergency supplies | Register and maintain available resource inventory |
| Command Center Admin | Govern and coordinate the network | Verify responders, manage users, view all requests, reassign work, and review analytics |

## Data and trust boundaries

- The React client calls the Express API under `/api/v1`.
- Express authenticates requests with JWT access/refresh tokens and enforces role middleware.
- MongoDB is the source of truth for users, profiles, requests, assignments, resources, shelters, notifications, and verification documents.
- Socket.IO provides real-time notifications; uploaded documents are served by the API after authorization.
- Empty or unavailable operational data is shown as empty/zero state. The six demo credentials are intentionally isolated to role testing and are not used as fallback metrics or fake operational records.

## Run the real workflow

1. Configure `server/.env` from `env.example` with MongoDB, JWT secrets, client URL, and upload settings.
2. Install dependencies with `npm run install:all`.
3. Start the API and client with `npm run dev`.
4. Run `npm run seed` when you want the six demo accounts created or refreshed. This command does not delete existing records.
5. On `/login`, click a role card to automatically enter that role's email and password, then press **Sign In**.
6. Register a real account at `/register`.
7. Use the administrator account configured in the environment to verify responder accounts.
8. Create requests, resources, shelters, and assignments through their role dashboards.
