# ServiceDesk Pro — AI-Enabled IT Helpdesk & Asset Management

[![Node.js](https://img.shields.io/badge/Node.js-v18+-68a063.svg?style=flat&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg?style=flat&logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47a248.svg?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-5.x-000000.svg?style=flat&logo=express)](https://expressjs.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4.svg?style=flat&logo=google)](https://ai.google.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646cff.svg?style=flat&logo=vite)](https://vitejs.dev/)

> An enterprise-grade, modern IT Service Management (ITSM) and Asset Lifecycle Management platform built on the **MERN** stack with **Google Gemini AI** assistance, real-time **SLA breach monitoring**, and granular **Role-Based Access Control (RBAC)**.

---

## 🌟 Key Highlights & Capabilities

### 1. 🛡️ Granular 5-Tier Role-Based Access Control (RBAC)
- **System Admin**: Complete administrative oversight — user provisioning, roles, departments, system-wide configuration, and SLA policies.
- **IT Manager**: Ticket assignment, technician workload balancing, SLA compliance auditing, workflow approvals, and department-level analytics.
- **Technician**: Ticket resolution, work logging (time spent & progress notes), internal notes vs. public comments, and asset association.
- **Asset Manager**: Full IT asset register (hardware/software), warranty tracking, procurement dates, vendor relationships, and asset lifecycle transitions.
- **Employee**: Self-service ticket creation with AI recommendations, real-time progress tracking, evidence file attachments, and resolution sign-offs.

### 2. 🤖 Google Gemini AI Engine
- **Automated Ticket Classification**: Instantly analyzes ticket title and description to predict the category, priority level, and urgency score.
- **Smart Knowledge Base Recommendations**: Automatically matches incoming incidents to relevant internal resolution articles to empower immediate self-service before technician escalation.

### 3. ⏱️ Automated SLA Engine & Real-Time Breach Monitor
- **Configurable SLA Policies**: Custom response and resolution time targets configured by ticket priority (Urgent, High, Medium, Low).
- **Background Cron Evaluator**: Automated background scheduler powered by `node-cron` evaluates active tickets against SLA deadlines every minute.
- **Automatic Escalation & Flagging**: Identifies approaching and breached tickets, transitions SLA status to `breached`, and generates real-time notifications for IT Managers.

### 4. 💻 Asset & Vendor Management
- **Asset Lifecycle Tracking**: Tracks hardware and software across states (`in_stock`, `assigned`, `under_repair`, `retired`, `disposed`).
- **Warranty & Lifecycle Auditing**: Logs serial numbers, asset tags, purchase dates, warranty expirations, and active user assignments.
- **Vendor Management**: Tracks IT vendors, contact persons, support contracts, and maintenance SLAs.

### 5. 📊 Operational Analytics, CSV & PDF Exports
- **Real-Time Dashboards**: KPI metric cards, status breakdown distribution, priority charts, and recent activity logs.
- **Authenticated CSV Exports**: 1-click CSV download for Tickets, Asset Inventory, and Technician Workload reports.
- **Client-Side Vector PDF Reports**: Formatted executive PDF report generator powered by `jspdf` and `jspdf-autotable`.
- **Print Optimization**: Native print stylesheet for physical printing or browser PDF output.

### 6. 🎨 Premium Modern UI & Experience
- **Fluid Light & Dark Theme**: Full CSS variable-driven theme switcher with instant persistence.
- **Dynamic Broadcast Ticker**: System-wide announcements for IT maintenance or critical incidents.
- **Responsive Layout**: Designed for desktop workstations, tablets, and mobile devices.

---

## 🏗️ Architecture & Project Structure

```
ServiceDesk Pro/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB connection configuration
│   │   ├── controllers/     # Express route handlers
│   │   ├── middleware/      # JWT auth, role validation, file upload
│   │   ├── models/          # Mongoose data schemas (Ticket, User, Asset, SLA, etc.)
│   │   ├── routes/          # REST API route endpoints
│   │   ├── scripts/         # Automated seeding scripts (Admin & Managers)
│   │   ├── services/        # Business logic, Gemini AI & SLA monitoring
│   │   ├── utils/           # JWT, workflow state transitions, SLA scheduler
│   │   ├── app.js           # Express application setup & middleware stack
│   │   └── server.js        # Server bootstrap & background cron initiator
│   ├── .env.example         # Backend environment variables template
│   ├── package.json
│   └── nodemon.json
│
├── frontend/
│   ├── public/              # Static assets and SVG icons
│   ├── src/
│   │   ├── components/      # Navbar, Sidebar, BroadcastTicker, Marquee, Logo
│   │   ├── context/         # AuthContext (JWT session) & ThemeContext (Dark/Light)
│   │   ├── pages/           # Dashboard, Tickets, CreateTicket, TicketDetails,
│   │   │                    # Assets, Reports, Users, SLAManagement, Vendors, KB
│   │   ├── routes/          # Protected & role-guarded React routes
│   │   ├── services/        # Axios API clients, CSV downloaders, jsPDF generators
│   │   ├── App.jsx          # Root layout and theme wrapper
│   │   ├── index.css        # Comprehensive design system & CSS variables
│   │   └── main.jsx         # Vite entry point
│   ├── package.json
│   └── vite.config.js       # Vite bundler configuration & API proxy
│
├── uploads/                 # Storage directory for ticket attachments
├── .env.example             # Project-wide environment template
├── .gitignore               # Strict ignore rules (ignores .env and node_modules)
├── package.json             # Root monorepo script runner
└── README.md                # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or MongoDB Atlas URI
- **Google Gemini API Key**: Free API key from [Google AI Studio](https://aistudio.google.com/)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/AbhishikthPaul12/servicedesk_pro.git
cd servicedesk_pro
```

---

### Step 2: Configure Environment Variables

Create a `.env` file inside the `backend/` folder:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your credentials:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/servicedesk
JWT_SECRET=your_super_secret_jwt_random_key_here
CLIENT_URL=http://localhost:3000
GEMINI_API_KEY=your_google_gemini_api_key_here
```

---

### Step 3: Install Dependencies

Install backend dependencies:
```bash
cd backend
npm install
```

Install frontend dependencies:
```bash
cd ../frontend
npm install
```

---

### Step 4: Seed Initial Data (Admin, Accounts & SLAs)

From the `backend` folder, run the automated seeders:
```bash
# Seed Administrator account
npm run seed:admin

# Seed Manager, Technician, and Asset Manager accounts
node src/scripts/seedManagers.js
```

Default credentials created:
| Role | Email | Password |
|---|---|---|
| **System Admin** | `admin@servicedesk.local` | `Admin@123` |
| **IT Manager** | `manager@servicedesk.local` | `Manager@123` |
| **Technician** | `tech@servicedesk.local` | `Tech@123` |
| **Asset Manager** | `assets@servicedesk.local` | `Asset@123` |
| **Employee** | `employee@servicedesk.local` | `Emp@123` |

---

### Step 5: Start Development Servers

You can start both servers using the root scripts or in separate terminal tabs:

**Terminal 1 — Backend API Server (`http://localhost:5000`):**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend Application (`http://localhost:3000`):**
```bash
cd frontend
npm run dev
```

Open your browser and navigate to **`http://localhost:3000`**.

---

### Step 6: Run Automated Tests

Run the backend unit test suite:
```bash
cd backend
npm test
```

This verifies ticket lifecycle state transitions, asset lifecycle state machine, SLA deadline calculations, and ObjectId validation middleware.

---

## 📡 REST API Reference Overview

| Endpoint | Method | Role Allowed | Description |
|---|---|---|---|
| `/api/auth/login` | POST | Public | Authenticate user & return JWT token |
| `/api/auth/register` | POST | Public | Register new employee account |
| `/api/auth/me` | GET | Authenticated | Retrieve current user profile |
| `/api/tickets` | GET | Authenticated | List tickets (filtered by role/dept) |
| `/api/tickets` | POST | Authenticated | Create ticket with optional AI classification |
| `/api/tickets/:id` | GET | Authenticated | Get ticket details, work logs, comments |
| `/api/tickets/:id/status` | PATCH | Tech / Managers | Transition ticket lifecycle status |
| `/api/tickets/:id/assign` | PATCH | IT Manager / Admin | Assign ticket to technician |
| `/api/tickets/:id/comments` | POST | Authenticated | Add public comment or internal note |
| `/api/ai/analyze-ticket` | POST | Authenticated | Gemini AI category/priority analysis |
| `/api/ai/suggest-solution` | POST | Authenticated | Gemini AI solution recommendation |
| `/api/assets` | GET, POST | Asset Manager / Admin | IT asset registry & management |
| `/api/slas` | GET, POST | IT Manager / Admin | SLA policy management |
| `/api/reports/tickets` | GET | IT Manager / Admin | Ticket & SLA analytical data |
| `/api/reports/tickets/export` | GET | IT Manager / Admin | Authenticated CSV export of tickets |
| `/api/reports/assets/export` | GET | Asset Manager / Admin | Authenticated CSV export of assets |
| `/api/reports/technicians/export`| GET | IT Manager / Admin | Authenticated CSV export of technician workload |

