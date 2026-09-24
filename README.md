# ServiceDesk Pro (ResolveDesk)

AI-enabled IT Helpdesk & Asset Management platform built on the **MERN** stack (ES modules only).

## Roles & Permissions

| Role | Capabilities |
|------|----------------|
| **System Admin** (`system_admin`) | Users, departments, categories, SLA policies, system config, audit logs, full ticket/asset access |
| **IT Manager** (`it_manager`) | Department-scoped tickets, assign/reassign technicians, approve/reject resolutions, escalate, SLA monitoring, reports, read-only team directory & asset overview |
| **Technician** (`technician`) | Assigned/authorized tickets only, work logs on own tickets, comments/internal notes, resolve → manager approval, limited asset ops (view, flag maintenance) |
| **Employee** (`employee`) | Create tickets (department auto-set), own tickets only, public comments/attachments, confirm resolution / reopen; **no** internal notes, work logs, or AI diagnostics |
| **Asset Manager** (`asset_manager`) | Full asset lifecycle, assignments, warranties, vendors; **no** general ticket management |

Legacy aliases `admin` ↔ `system_admin` and `manager` ↔ `it_manager` are still accepted for compatibility, but new code uses the canonical names.

**Principle:** Frontend visibility ≠ authorization. Every restriction is enforced by the backend.

### Department scoping (IT Manager)

- Forced: `ticket.department === req.user.department`
- Query params such as `?department=OTHER` **cannot** override this
- Applies to tickets, dashboard, reports, CSV exports, SLA metrics, technician workload

### Technician ticket visibility

Technicians see only:

- tickets assigned to them
- tickets in `authorizedTechnicians`
- tickets they created

They do **not** automatically see all department tickets.

---

## Ticket Workflow

```
Open → Assigned → In Progress → Resolved
                                      ↓ (technician resolve auto-enters)
                         Awaiting Manager Approval
                                      ↓
                         Approve → Closed
                         Reject  → In Progress / Reopened
Closed / Resolved → Reopened → In Progress
```

| Role | Allowed actions |
|------|-----------------|
| Technician | open→assigned/in_progress, assigned→in_progress, in_progress→resolved (→ awaiting approval), reopened→in_progress. **Cannot close.** |
| IT Manager | assign/reassign, operational transitions, approve/reject, escalate, reopen |
| Employee | confirm close / reopen when appropriate |
| System Admin | full workflow |

Approval fields: `approvalStatus`, `approvedBy`, `approvedAt`, `approvalComment`.

Escalation fields: `isEscalated`, `escalatedBy`, `escalatedAt`, `escalationReason`.

---

## SLA

States: `not_started`, `active`, `at_risk`, `breached`, `met`, `escalated`.

- **Resolution SLA:** `slaDueDate` (business-hours aware)
- **Response SLA:** `slaResponseDueDate` + `firstResponseAt` (set on first staff comment/work log)
- **At-risk threshold:** configurable via System Config (`slaAtRiskThresholdPercent`, default **80%**)
- **Business hours:** working days Mon–Fri, start/end hour, optional holiday list (YYYY-MM-DD), stored in `SystemConfig`
- Scheduler uses actor **SYSTEM** (`isSystemAction: true`) — never impersonates a human manager
- Breach / at-risk notifications go to department **`it_manager`** users (legacy `manager` included)

---

## Assets

Lifecycle: `procurement` → `available` → `assigned` → `maintenance` → `retired`

- **Retired → Available** is **not** a normal transition; requires explicit audited reactivation (`reactivate=true`)
- Soft-delete/archive preferred over hard delete
- Assignment validates active users; history recorded
- Technicians: view + flag maintenance / notes only
- Asset Managers / System Admins: full lifecycle

---

## Key API routes

| Area | Routes |
|------|--------|
| Auth | `POST /api/auth/login`, `register`, `GET /api/auth/me` |
| Tickets | `GET/POST /api/tickets`, `GET/PATCH /api/tickets/:id`, `PATCH .../assign`, `POST .../approve`, `.../reject`, `.../escalate`, comments, work-logs, attachments |
| AI | `POST /api/ai/tickets/:id/analyze`, `.../knowledge-suggestions` (ticket access enforced) |
| Users | `GET/POST /api/users`, `PATCH /api/users/:id` (create/update: System Admin only; IT Manager: read-only directory) |
| Departments | `/api/departments` |
| Categories | `/api/categories` |
| Config | `/api/config` |
| Audit | `/api/audit` |
| Dashboard | `/api/dashboard/overview`, `/tickets`, `/technicians`, `/assets` (dept-scoped for managers) |
| Reports | `/api/reports/tickets`, `/technicians`, `/assets` + CSV exports |
| Assets | `/api/assets` (+ assign/return) |
| Knowledge | `/api/knowledge` (employees: published + visibility `all` only) |

---

## Local setup

**Prerequisites:** Node.js 18+, MongoDB, optional Gemini API key.

```bash
cp .env.example backend/.env
# Edit MONGO_URI, JWT_SECRET, CLIENT_URL, GEMINI_API_KEY

cd backend && npm install
cd ../frontend && npm install

cd backend
npm run seed:admin
node src/scripts/seedManagers.js

npm run dev          # API :5000
cd ../frontend && npm run dev   # UI (see vite.config for port)
```

### Environment variables

| Variable | Purpose |
|----------|---------|
| `PORT` | API port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `CLIENT_URL` | Frontend origin for CORS |
| `GEMINI_API_KEY` | Google Gemini for AI features |

### Seed / test accounts

See seeder output. README examples (confirm against your seed scripts):

| Role | Typical email | Notes |
|------|---------------|-------|
| System Admin | from `seedAdmin.js` | Full admin |
| IT Manager | `itmanager@servicedesk.com` | Department should be assigned in DB |
| Asset Manager | `assetmanager@servicedesk.com` | Assets only |

Assign `department` on managers/technicians/employees in MongoDB or via System Admin user management for department scoping to work.

### Tests & build

```bash
cd backend && npm test
cd ../frontend && npm run build
```

---

## Architecture notes

- Backend & frontend use `"type": "module"` — **no CommonJS**, **no TypeScript**
- Authorization helpers: `backend/src/utils/authorization.js`, `roles.js`, `ticketWorkflow.js`
- Audit: `backend/src/services/auditService.js` + `/api/audit`
- Internal notes: frontend may send `isInternal`; backend normalizes to `type: "internal_note" | "comment"`

---

## Production

- Set strong `JWT_SECRET`, production `MONGO_URI`, restrict CORS `CLIENT_URL`
- `NODE_ENV=production` hides stack traces in API errors
- Do not commit `.env` or secrets
- Serve frontend build via CDN/static host; point API to backend URL (`VITE_API_URL` if used)
