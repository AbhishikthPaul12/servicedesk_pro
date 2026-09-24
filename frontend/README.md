# ResolveDesk Frontend (ServiceDesk Pro)

Single-page web application for ResolveDesk IT Service Management and Asset Lifecycle tracking. Built with React 18, Vite, React Router v6, Lucide icons, and Framer Motion animations. Features role-aware navigation, interactive ticket workflows, real-time SLA tracking, AI diagnostic panels, and client-side PDF/CSV reporting.

---

## Technology Stack

- **Framework & Runtime:** React 18 (`react@^18.2.0`, `react-dom@^18.2.0`)
- **Build Tool:** Vite 5 (`vite@^5.1.6`, `@vitejs/plugin-react@^4.2.1`)
- **Routing:** React Router DOM v6 (`react-router-dom@^6.22.3`)
- **HTTP Client:** Axios (`axios@^1.6.8`)
- **UI Icons:** Lucide React (`lucide-react@^0.344.0`)
- **Animations:** Framer Motion (`framer-motion@^13.2.0`)
- **Client-Side PDF Generation:** jsPDF (`jspdf@^4.2.1`) & jsPDF-AutoTable (`jspdf-autotable@^5.0.8`)
- **Styling:** Vanilla CSS design system (`src/index.css`) with CSS custom properties, responsive layouts, and dark mode themes

---

## Directory Structure

```
frontend/
├── src/
│   ├── App.jsx                # Root application container, layout shell, and theme provider
│   ├── main.jsx               # React entry point mounting into index.html
│   ├── index.css              # Global styling tokens, components, themes, and layout rules
│   ├── components/            # Reusable interface components
│   │   ├── AuthMarquee.jsx       # Rolling product features banner for login/register
│   │   ├── BroadcastTicker.jsx   # Live system notifications and operational ticker
│   │   ├── DashboardMarquee.jsx  # Operational highlights banner on the dashboard
│   │   ├── Logo.jsx              # Vector monogram SVG logo with gradient styling
│   │   ├── Navbar.jsx            # Top navigation bar, search, theme toggle, alerts dropdown
│   │   └── Sidebar.jsx           # Role-aware animated navigation sidebar
│   ├── context/               # Global state providers
│   │   └── AuthContext.jsx       # User identity, token storage, and role boolean flags
│   ├── pages/                 # Full-page route views (17 pages)
│   │   ├── Assets.jsx            # Asset inventory catalog, assignment & return modals
│   │   ├── AuditLogs.jsx         # Security activity log viewer
│   │   ├── Categories.jsx        # Service category configuration
│   │   ├── CreateTicket.jsx      # Ticket creation form with attachment upload
│   │   ├── Dashboard.jsx         # Role-specific analytics, SLA compliance, workload
│   │   ├── Departments.jsx       # Organizational department manager
│   │   ├── KnowledgeArticle.jsx  # Article viewer with rich formatting
│   │   ├── KnowledgeBase.jsx     # Solution repository, search, draft authoring
│   │   ├── Login.jsx             # User login portal
│   │   ├── Register.jsx          # Employee self-registration
│   │   ├── Reports.jsx           # Metric summaries, CSV download, PDF generation
│   │   ├── SLAManagement.jsx     # Policy creation and priority threshold settings
│   │   ├── SystemConfig.jsx      # Operating hours, holiday lists, SLA parameters
│   │   ├── TicketDetails.jsx     # Detailed ticket view, timeline, work logs, AI panel
│   │   ├── Tickets.jsx           # Filterable ticket table with saved views and pagination
│   │   ├── Users.jsx             # User administration & IT Manager team directory
│   │   └── VendorManagement.jsx  # Supplier and hardware vendor records
│   ├── routes/
│   │   └── AppRoutes.jsx         # Route definitions and <ProtectedRoute> authorization
│   ├── services/              # API consumption layer (Axios modules)
│   │   ├── api.js                # Base Axios instance with token interceptors
│   │   ├── assetService.js       # Asset CRUD and assignment API calls
│   │   ├── authService.js        # Authentication endpoints (login, register, me)
│   │   ├── dashboardService.js   # Dashboard metrics and workload feeds
│   │   ├── knowledgeService.js   # Knowledge base API calls
│   │   ├── notificationService.js# In-app notifications API calls
│   │   ├── reportService.js      # Reports, CSV triggers, and client-side jsPDF exports
│   │   ├── slaService.js         # SLA policy API calls
│   │   ├── ticketService.js      # Ticket operations, comments, logs, approval, AI
│   │   ├── userService.js        # User management API calls
│   │   └── vendorService.js      # Vendor management API calls
│   └── utils/                 # Frontend helpers
│       └── roles.js              # Role labels, badge color mappings, UI transition maps
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## Application Architecture & State Management

### 1. Authentication & Global State (`AuthContext.jsx`)
Global state is managed via React Context without external state libraries:
- **Token Persistence:** Stored in `localStorage.getItem("token")`.
- **Session Initialization:** On application load, `useEffect` invokes `getMe()` to fetch the active user profile and validate token validity.
- **Convenience Role Flags:** `AuthContext` provides calculated booleans consumed by UI components:
  - `isSystemAdmin` (`role === "system_admin" || role === "admin"`)
  - `isITManager` (`role === "it_manager" || role === "manager"`)
  - `isTechnician` (`role === "technician"`)
  - `isEmployee` (`role === "employee"`)
  - `isAssetManager` (`role === "asset_manager"`)

### 2. Client-Side Role Handling vs. Backend Security Boundary
> **Important Security Boundary:** Frontend role checks in `Sidebar.jsx` and `<ProtectedRoute>` are strictly for **user experience**, contextual navigation, and UI streamlining. The backend API is the **sole authoritative source of truth**. Every mutation, query, and record access is independently validated by the server regardless of client state.

### 3. Route Protection (`AppRoutes.jsx`)
Routes are guarded using the `<ProtectedRoute>` wrapper component:
- Unauthenticated visitors are redirected to `/login`.
- If an `allowedRoles` array is provided, users without a matching role are redirected to `/dashboard`.
- Routes are partitioned as follows:
  - **All Authenticated:** `/dashboard`, `/tickets`, `/tickets/new`, `/tickets/:id`, `/knowledge`, `/knowledge/:id`
  - **Staff Only (Admin, IT Manager, Asset Manager, Tech):** `/assets`
  - **Management & Admins:** `/reports`, `/users` (IT Managers see a read-only team directory)
  - **Asset Specialists:** `/vendors` (`system_admin`, `asset_manager`)
  - **System Admin Exclusives:** `/sla`, `/departments`, `/categories`, `/config`, `/audit`

---

## Core Interfaces & User Workflows

### 1. Navigation Shell (`Sidebar.jsx` & `Navbar.jsx`)
- **Animated Sidebar:** Displays only the links permitted for the active user's role.
- **Dynamic Role Badges:** Shows colored indicators matching the user's role in the sidebar footer and user profile dropdown.
- **Broadcast Ticker (`BroadcastTicker.jsx`):** High-priority operational broadcast bar displaying active announcements and critical incident alerts.
- **In-App Notification Center:** Polls active notifications with direct links to tickets.

### 2. Ticket Management (`Tickets.jsx` & `TicketDetails.jsx`)
- **List & Search:** Filter by status, priority, category, department, or free-text search. Supports saving custom search filters via `/api/saved-filters`.
- **Role-Aware Views:**
  - Employees see only their created tickets ("My Tickets").
  - Technicians see only assigned/authorized tickets ("Assigned Tickets").
  - IT Managers see all tickets scoped to their department.
  - System Admins see tenant-wide tickets with department filter dropdowns.
- **Ticket Details View (`TicketDetails.jsx`):**
  - **Timeline:** Visual progress tracker from creation to resolution and closure.
  - **Conversations:** Public comments for requester communication and toggleable internal notes (hidden from employees).
  - **Technician Work Logs:** Time tracking subsystem recording effort in minutes.
  - **Manager Approval Banner:** Prompts IT Managers when a ticket enters `awaiting_manager_approval` to review and choose **Approve** (closes ticket) or **Reject** (reopens to `in_progress` with feedback).
  - **AI Diagnostics Panel:** Technicians and managers can trigger on-demand Gemini AI analysis for category/priority classification, root cause analysis, and knowledge article recommendations.

### 3. Asset Lifecycle Tracking (`Assets.jsx`)
- **Asset Catalog:** Filter by hardware/software, state (`available`, `assigned`, `maintenance`, `retired`), and location.
- **Assignment Modal:** Allows Asset Managers and Admins to assign available assets to any active employee, technician, or manager.
- **Return Modal:** Processes asset hand-ins back into the available pool.
- **Maintenance Actions:** Technicians and managers can flag assets for repair.

### 4. SLA Management & Operations (`SLAManagement.jsx`)
- Configuration of response targets and resolution targets in minutes per priority level.
- Live SLA badge indicators across ticket tables:
  - `active` (blue)
  - `at_risk` (amber, consumed ≥80% of window)
  - `breached` (red, passed deadline)
  - `met` (emerald, resolved within window)
  - `escalated` (purple)

### 5. Reporting & Analytics (`Reports.jsx`)
- **Metric Cards:** SLA compliance percentages, open vs. closed ratios, category distributions.
- **CSV Data Exports:** Authenticated streaming downloads for tickets, assets, and technician performance.
- **Client-Side PDF Generation:** Built using `jspdf` and `jspdf-autotable` in `src/services/reportService.js`:
  - `exportTicketsPDF`: Formatted SLA compliance and ticket status breakdown tables.
  - `exportAssetsPDF`: Asset inventory status distribution report.
  - `exportTechniciansPDF`: Technician workload and active assignment summary.

---

## API & Service Layer

The frontend communicates with the backend via Axios modules located in `src/services/`:

### Base HTTP Client (`src/services/api.js`)
- Configured with `baseURL`:
  ```javascript
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/api`
    : "/api"
  ```
- **Request Interceptor:** Automatically extracts token from `localStorage` and attaches `Authorization: Bearer <token>`.
- **Response Interceptor:** Automatically clears token and redirects to `/login` if a `401 Unauthorized` response is intercepted.

### Domain Service Mapping
- `authService.js`: `loginUser`, `registerUser`, `getMe`
- `ticketService.js`: `getTickets`, `getTicketById`, `createTicket`, `updateTicket`, `assignTicket`, `approveTicket`, `rejectTicket`, `escalateTicket`, `addComment`, `addWorkLog`, `analyzeTicketAI`, `getAISuggestions`
- `assetService.js`: `getAssets`, `createAsset`, `updateAsset`, `assignAsset`, `returnAsset`, `deleteAsset`
- `reportService.js`: `getTicketReport`, `exportTicketsCSV`, `exportTicketsPDF`, `exportAssetsPDF`, `exportTechniciansPDF`
- `knowledgeService.js`: `getArticles`, `getArticleById`, `createArticle`, `updateArticle`, `deleteArticle`
- `slaService.js`: `getSLAPolicies`, `updateSLAPolicy`
- `userService.js`: `getUsers`, `createUser`, `updateUser`
- `vendorService.js`: `getVendors`, `createVendor`, `updateVendor`, `deleteVendor`
- `notificationService.js`: `getNotifications`, `markAsRead`

---

## Environment Variables

Configure in `frontend/.env` (or via deployment platform environment settings):

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `VITE_API_URL` | No | `/api` (local proxy) | Target URL of backend API (e.g. `https://api.yourdomain.com`) |

---

## Development & Build Commands

All commands are executed from the `frontend/` directory:

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server (hot-reloading enabled)
npm run dev

# 3. Compile optimized production bundle to dist/
npm run build

# 4. Preview the production build locally
npm run preview
```

---

## Production Deployment

When deploying the frontend to static hosting services (e.g., Vercel, Netlify, Render Static Site):
1. Build command: `npm run build`
2. Publish directory: `dist`
3. Configure `VITE_API_URL` pointing to your deployed backend URL.
4. Ensure single-page app (SPA) rewrite rules are configured so all unmatched paths route to `index.html`.
