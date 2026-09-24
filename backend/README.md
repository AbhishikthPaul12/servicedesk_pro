# ResolveDesk Backend (ServiceDesk Pro)

RESTful API backend for the ResolveDesk IT Service Management and Asset Lifecycle platform. Built with Node.js and Express in ES module syntax, providing authoritative Role-Based Access Control (RBAC), department-isolated scoping, SLA business-hour calculation, automated lifecycle state machines, and AI-assisted ticket triage.

---

## Technology Stack

- **Runtime:** Node.js (v18+)
- **Module System:** ECMAScript Modules (`"type": "module"`)
- **Web Framework:** Express 5 (`express@^5.2.1`)
- **Database & ODM:** MongoDB with Mongoose (`mongoose@^9.9.4`)
- **Authentication & Security:** JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `helmet`, `cookie-parser`, `cors`
- **Validation:** `express-validator@^7.3.2`
- **File Uploads:** `multer@^2.3.0`
- **Job Scheduling:** `node-cron@^4.6.0`
- **AI Integration:** Google GenAI SDK (`@google/genai@^2.21.0`)

---

## Directory Structure

```
backend/
├── src/
│   ├── app.js                 # Express application configuration, middleware, and route mounting
│   ├── server.js              # Server entry point, database connection, and cron initialization
│   ├── config/
│   │   └── db.js              # Mongoose database connection logic
│   ├── controllers/           # HTTP route handlers
│   │   ├── aiController.js
│   │   ├── assetController.js
│   │   ├── auditController.js
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── configController.js
│   │   ├── dashboardController.js
│   │   ├── departmentController.js
│   │   ├── knowledgeArticleController.js
│   │   ├── notificationController.js
│   │   ├── reportController.js
│   │   ├── savedFilterController.js
│   │   ├── slaController.js
│   │   ├── ticketCommentController.js
│   │   ├── ticketController.js
│   │   ├── userController.js
│   │   ├── vendorController.js
│   │   └── workLogController.js
│   ├── middleware/            # Pipeline middleware
│   │   ├── authMiddleware.js     # JWT token extraction and user verification
│   │   ├── errorMiddleware.js    # 404 handler and centralized error parsing
│   │   ├── roleMiddleware.js     # Route-level RBAC role authorization
│   │   ├── uploadMiddleware.js   # Multer file upload configuration and validation
│   │   ├── validateObjectId.js   # MongoDB ObjectId route parameter validation
│   │   └── validateRequest.js    # express-validator error collection handler
│   ├── models/                # Mongoose data schemas and models (14 models)
│   │   ├── Asset.js
│   │   ├── AuditLog.js
│   │   ├── Category.js
│   │   ├── Department.js
│   │   ├── KnowledgeArticle.js
│   │   ├── Notification.js
│   │   ├── SavedFilter.js
│   │   ├── SLA.js
│   │   ├── SystemConfig.js
│   │   ├── Ticket.js
│   │   ├── TicketComment.js
│   │   ├── User.js
│   │   ├── Vendor.js
│   │   └── WorkLog.js
│   ├── routes/                # Express API router definitions (16 route files)
│   │   ├── aiRoutes.js
│   │   ├── assetRoutes.js
│   │   ├── auditRoutes.js
│   │   ├── authRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── configRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── departmentRoutes.js
│   │   ├── knowledgeArticleRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── savedFilterRoutes.js
│   │   ├── slaRoutes.js
│   │   ├── ticketRoutes.js
│   │   ├── userRoutes.js
│   │   └── vendorRoutes.js
│   ├── scripts/               # Administrative database seed utilities
│   │   ├── seedAdmin.js
│   │   └── seedManagers.js
│   ├── services/              # Domain logic, AI integration, SLA engine, reporting
│   │   ├── aiService.js
│   │   ├── auditService.js
│   │   ├── dashboardService.js
│   │   ├── firstResponseService.js
│   │   ├── notificationService.js
│   │   ├── reportService.js
│   │   ├── slaMonitorService.js
│   │   └── slaService.js
│   ├── utils/                 # Business logic helpers, state machines, schedulers
│   │   ├── assetLifecycle.js
│   │   ├── authorization.js
│   │   ├── departmentValidation.js
│   │   ├── jwt.js
│   │   ├── roles.js
│   │   ├── seedSLA.js
│   │   ├── slaScheduler.js
│   │   └── ticketWorkflow.js
│   └── validators/            # express-validator rule definitions
│       ├── assetValidators.js
│       ├── authValidators.js
│       ├── knowledgeValidators.js
│       ├── ticketValidators.js
│       ├── userValidators.js
│       └── vendorValidators.js
├── package.json
└── README.md
```

---

## Request Lifecycle & Architecture

Incoming requests traverse through a standardized, sequential pipeline:

```
HTTP Request
  │
  ▼
Security & Parsing (Helmet, CORS, JSON, URL-Encoded, CookieParser)
  │
  ▼
Static Asset Serving (/uploads)
  │
  ▼
Authentication Middleware (authMiddleware.protect)
  │  ├── Extract Bearer token from Authorization header or cookies
  │  └── Verify JWT and attach active User document to req.user
  │
  ▼
Route-Level RBAC (roleMiddleware.authorize)
  │  └── Match req.user.role against permitted roles
  │
  ▼
Parameter & Body Validation
  │  ├── validateObjectId: Verify MongoDB ObjectId format
  │  ├── express-validator rules: Sanitize and validate inputs
  │  └── validateRequest: Return 400 with structured validation errors
  │
  ▼
Controller Handler
  │  ├── Enforce department and record-level authorization (authorization.js)
  │  └── Dispatch domain actions to models and services
  │
  ▼
Services & Persistence
  │  ├── Execute business logic (AI triage, SLA calculation, audit logging)
  │  └── Read/Write to MongoDB via Mongoose models
  │
  ▼
Centralized Error Handler (errorMiddleware.errorHandler)
  └── Format response (Mongoose CastError, ValidationError, MongoError 11000)
```

---

## Authentication & Authorization

### JWT Authentication

- User authentication is performed via `POST /api/auth/login`.
- Passwords are encrypted with `bcryptjs` using a salt work factor of 12.
- Upon valid credentials, a signed JWT containing `{ id, role }` is generated with an expiration period of 7 days (or `JWT_EXPIRES_IN`).
- Client requests must include the header:
  ```http
  Authorization: Bearer <jwt_token>
  ```
- The current user payload is retrieved via `GET /api/auth/me`.

### Role-Based Access Control (RBAC)

The system supports five canonical roles, while recognizing legacy database aliases:

| Canonical Role | Legacy Aliases | Core Scope |
|---|---|---|
| `system_admin` | `admin` | Unrestricted global access across all tenants, configurations, audit trails, and data. |
| `it_manager` | `manager` | Operational command of tickets, SLA metrics, reports, and staff within their assigned department. |
| `technician` | — | Access restricted strictly to tickets assigned to them or tickets in `authorizedTechnicians`. |
| `employee` | — | Access restricted strictly to self-created tickets. Cannot see internal notes or work logs. |
| `asset_manager` | — | Dedicated authority over physical/software assets and vendors. Zero ticket access. |

### Department Scoping (Authoritative Server-Side Isolation)

Security boundaries are strictly enforced on the server. Client-provided query parameters cannot bypass these boundaries:

- **IT Managers:** When an `it_manager` queries tickets, dashboard metrics, reports, or technician workloads, the server forces:
  ```javascript
  filter.department = req.user.department;
  ```
  Any query parameter such as `?department=OTHER` is ignored.
- **Technicians:** Technicians are scoped strictly to tickets where:
  ```javascript
  { $or: [{ assignedTo: req.user._id }, { authorizedTechnicians: req.user._id }, { createdBy: req.user._id }] }
  ```
- **Employees:** Automatically forced to view only tickets where `createdBy === req.user._id`. When creating tickets, `ticket.department` is forced to `req.user.department`.

---

## Ticket Workflow & State Machine

Ticket status changes follow an audited state machine defined in `src/utils/ticketWorkflow.js`:

```
   ┌────────────────────────────────────────────────────────┐
   │                                                        │
   ▼                                                        │
[open] ──► [assigned] ──► [in_progress] ──► [resolved]      │ (Reopened)
                              │                  │          │
                              │                  ▼          │
                              │     [awaiting_manager_approval]
                              │         │              │    │
                              │         ▼              ▼    │
                              │     (Rejected)     (Approved)
                              │         │              │    │
                              └─────────┘              ▼    │
                                                    [closed]
                                                       │
                                                       └────┘
```

### State Transition Rules

| Initial Status | Permitted Target Statuses | Authorized Roles |
|---|---|---|
| `open` | `assigned`, `in_progress`, `closed` | `system_admin`, `it_manager`, `technician` (`closed` only for managers/admins) |
| `assigned` | `in_progress`, `open`, `closed` | `system_admin`, `it_manager`, `technician` |
| `in_progress` | `resolved`, `assigned`, `on_hold`, `closed` | `system_admin`, `it_manager`, `technician` |
| `on_hold` | `in_progress`, `assigned`, `closed` | `system_admin`, `it_manager`, `technician` |
| `resolved` | `awaiting_manager_approval`, `closed`, `reopened` | Role dependent (see approval flow below) |
| `awaiting_manager_approval` | `closed` (approve), `in_progress` (reject) | `system_admin`, `it_manager` only |
| `closed` | `reopened` | `system_admin`, `it_manager`, `employee` |
| `reopened` | `in_progress`, `assigned`, `closed` | `system_admin`, `it_manager`, `technician` |

### Manager Approval Subsystem

1. When a **Technician** marks a ticket as `resolved`:
   - Status automatically shifts to `awaiting_manager_approval`.
   - `approvalStatus` is set to `"pending"`.
   - A notification is automatically generated for department managers.
2. A **Technician cannot** directly set a ticket to `closed`, nor can they self-approve resolutions.
3. An **IT Manager** or **System Admin** resolves the approval:
   - **Approve (`POST /api/tickets/:id/approve`):** Sets status to `closed`, `approvalStatus = "approved"`, stamps `approvedBy` and `approvedAt`.
   - **Reject (`POST /api/tickets/:id/reject`):** Reverts status to `in_progress`, `approvalStatus = "rejected"`, resets `resolvedAt = null`, records manager feedback notes.

---

## SLA Engine & Business Hours

The SLA service (`src/services/slaService.js` and `src/services/slaMonitorService.js`) calculates SLA deadlines and monitors compliance based on business hours.

### Business-Hour Calculation Algorithm

SLA deadlines are calculated using `addBusinessMinutes`:
- Skips non-working days (default: Monday through Friday; Sunday=0, Saturday=6).
- Skips non-operational hours (default: 09:00 to 17:00 UTC, configurable in `SystemConfig`).
- Skips statutory holidays configured in `SystemConfig.businessHours.holidays` (`YYYY-MM-DD`).
- Advances remaining minutes only while the clock is inside active operational windows.

### SLA States and Timers

- **Resolution SLA:** Target deadline (`slaDueDate`) computed upon ticket creation based on priority policy.
- **Response SLA:** Target first-response deadline (`slaResponseDueDate`). Stamped with `firstResponseAt` upon the first technician or manager comment or work log.
- **SLA Status Progression:**
  - `not_started` ──► `active` ──► `at_risk` (consumed ≥80% of window) ──► `breached` (past target date)
  - When resolved on time: status transitions to `met`.
  - Auto-escalation: When priority SLA specifies escalation or breach occurs, the ticket is flagged with `isEscalated = true` and `slaStatus = "escalated"`.
- **Scheduled Monitor:** A `node-cron` background worker runs every minute (`* * * * *`) via `src/utils/slaScheduler.js` to scan open tickets, update SLA states, and trigger notifications to department managers.

---

## Asset Lifecycle Management

The asset management subsystem (`src/controllers/assetController.js` and `src/utils/assetLifecycle.js`) tracks hardware and software inventories.

```
[procurement] ──► [available] ◄────► [assigned]
                       │                 │
                       ▼                 ▼
                 [maintenance] ◄─────────┘
                       │
                       ▼
                   [retired]
```

- **Transitions:** Handled by `validateAssetTransition(currentStatus, newStatus)`.
- **Assignment (`PATCH /api/assets/:id/assign`):** Assigns an available asset to any active employee, technician, or manager. Stamped with `assignedUser`, `assignedDate`, and historical assignment logs.
- **Return (`PATCH /api/assets/:id/return`):** Clears `assignedUser`, sets status to `available`, and records return date.
- **Restricted Reactivation:** Assets in `retired` state cannot be returned to service without an explicit administrative override (`reactivate=true`).

---

## AI Services & Triage

Located in `src/services/aiService.js`, powered by the Google GenAI SDK (`@google/genai`):

- **Model:** Configurable via `GEMINI_MODEL` (defaults to `gemini-2.5-flash`).
- **Ticket Analysis (`POST /api/ai/tickets/:id/analyze`):**
  - Evaluates ticket title and description.
  - Predicts appropriate category (`hardware`, `software`, `network`, `access`, `security`, `other`).
  - Estimates priority (`low`, `medium`, `high`, `critical`).
  - Formulates probable issue identification, root cause diagnostic, and recommended troubleshooting steps.
- **Heuristic Fallback:** If `GEMINI_API_KEY` is not configured or an external API error occurs, the service falls back to local regex-based classification heuristics.
- **Knowledge Article Recommendations (`POST /api/ai/tickets/:id/knowledge-suggestions`):**
  - Scans published knowledge base articles.
  - Computes keyword/relevance match against ticket details and surfaces top ranked solutions to technicians.

---

## API Route Groups

All endpoints are prefixed with `/api` and registered in `src/app.js`:

| Route Group | Base Path | Primary Role Access | Description |
|---|---|---|---|
| **Health** | `GET /api/health` | Public | System status and uptime check |
| **Auth** | `/api/auth` | Public / Authenticated | Login, registration, profile (`/me`) |
| **Users** | `/api/users` | `system_admin`, `it_manager` | User creation, role updates, team directory |
| **Tickets** | `/api/tickets` | Role-dependent | Full ticket lifecycle, approval, comments, work logs |
| **Assets** | `/api/assets` | `system_admin`, `asset_manager`, `it_manager`, `technician` | Asset tracking, assignments, returns, maintenance |
| **Vendors** | `/api/vendors` | `system_admin`, `asset_manager` | Supplier and hardware vendor records |
| **Knowledge** | `/api/knowledge` | Authenticated | Articles, authoring drafts, published solutions |
| **AI** | `/api/ai` | `system_admin`, `it_manager`, `technician` | Gemini classification and solution recommendation |
| **SLA** | `/api/sla` | Authenticated (Read), `system_admin` (Write) | SLA policies and priority target configuration |
| **Dashboard** | `/api/dashboard` | Role-dependent | Summary metrics, technician workload, SLA stats |
| **Reports** | `/api/reports` | `system_admin`, `it_manager`, `asset_manager` | Aggregated metrics and streaming CSV exports |
| **Departments** | `/api/departments`| Authenticated (Read), `system_admin` (Write) | Department catalog management |
| **Categories** | `/api/categories` | Authenticated (Read), `system_admin` (Write) | Ticket category catalog |
| **Config** | `/api/config` | `system_admin` | Business hours, holiday calendars, SLA thresholds |
| **Audit** | `/api/audit` | `system_admin` | Immutable activity and security audit trail |
| **Notifications**| `/api/notifications`| Authenticated | In-app alerts, unread counts, mark-read |
| **Saved Filters**| `/api/saved-filters`| Authenticated | User-specific ticket filter presets |

---

## Important API Examples

### 1. User Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "itmanager@servicedesk.com",
  "password": "Manager123!"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "66f1234567890abcdef12345",
    "name": "IT Operations Manager",
    "email": "itmanager@servicedesk.com",
    "role": "it_manager",
    "department": "66f1234567890abcdef12300"
  }
}
```

### 2. Create Support Ticket
```http
POST /api/tickets
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "VPN connection drops repeatedly",
  "description": "After 10 minutes of connecting to the office VPN, the tunnel drops.",
  "category": "network",
  "priority": "high"
}
```

### 3. Assign Ticket to Technician
```http
PATCH /api/tickets/66f1234567890abcdef12345/assign
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "technicianId": "66f1234567890abcdef12388"
}
```

### 4. Approve Ticket Resolution
```http
POST /api/tickets/66f1234567890abcdef12345/approve
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "comment": "Resolution verified with the employee. Closing ticket."
}
```

### 5. Trigger AI Ticket Analysis
```http
POST /api/ai/tickets/66f1234567890abcdef12345/analyze
Authorization: Bearer <jwt_token>
```
**Response (200 OK):**
```json
{
  "success": true,
  "analysis": {
    "category": "network",
    "priority": "high",
    "probableIssue": "Network tunnel timeout or gateway keep-alive misconfiguration",
    "confidence": 0.92,
    "rootCauseAnalysis": "Client-side MTU misconfiguration or session timeout on the edge firewall.",
    "suggestedNextSteps": [
      "Verify client VPN client version",
      "Check split-tunnel routing table",
      "Inspect edge firewall session logs"
    ]
  }
}
```

---

## Environment Variables

Configure these keys in `backend/.env`:

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | No | `5000` | Port on which Express listens |
| `NODE_ENV` | No | `development` | Environment mode (`development` / `production`) |
| `MONGO_URI` | Yes | `mongodb://127.0.0.1:27017/resolvedesk` | MongoDB connection connection string |
| `JWT_SECRET` | Yes | — | Cryptographic secret for signing tokens |
| `JWT_EXPIRES_IN`| No | `7d` | Lifespan of generated JWT tokens |
| `CLIENT_URL` | No | `http://localhost:5173` | Allowed frontend origin for CORS |
| `GEMINI_API_KEY`| No | — | Google Gemini API key for AI features |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model identifier |

---

## Installation, Seeding & Execution

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Seed Database
Seed administrative and department-scoped test accounts:

```bash
# Seed default System Administrator (admin@servicedesk.com / Admin123!)
npm run seed:admin

# Seed IT Manager, Technician, Employee, and Asset Manager accounts
npm run seed:managers
```

Default credentials provisioned:
- **System Admin:** `admin@servicedesk.com` / `Admin123!`
- **IT Manager:** `itmanager@servicedesk.com` / `Manager123!` (Dept: IT)
- **Technician:** `tech@servicedesk.com` / `Tech123!` (Dept: IT)
- **Employee:** `employee@servicedesk.com` / `Emp123!` (Dept: IT)
- **Asset Manager:** `assetmanager@servicedesk.com` / `Asset123!`

### 3. Run Development Server
```bash
npm run dev
```
Starts backend server via `nodemon` with hot reloading on `http://localhost:5000`.

### 4. Run Production Server
```bash
npm start
```
Starts backend server directly with Node.js.

---

## Production Deployment

The backend is configured for deployment on PaaS providers such as Render via the root `render.yaml` specification:

```yaml
services:
  - type: web
    name: servicedesk-pro-backend
    env: node
    plan: free
    rootDir: backend
    buildCommand: npm install
    startCommand: npm start
```

For production deployments:
1. Ensure `NODE_ENV=production` is set (suppresses stack traces in error responses).
2. Configure a persistent MongoDB Atlas cluster URI in `MONGO_URI`.
3. Set a high-entropy string for `JWT_SECRET`.
4. Point `CLIENT_URL` to your production frontend domain.
