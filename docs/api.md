# RESTful API Reference Specification

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected routes require the HTTP header:
```
Authorization: Bearer <JWT_ACCESS_TOKEN>
```
Agent telemetry routes require:
```
x-agent-key: <AGENT_SECRET_KEY>
```

---

## Endpoints

### 1. Authentication
* `POST /api/auth/login` — Authenticate user.
  * Body: `{ "email": "admin@company.local", "password": "Admin@123" }`
  * Response: `{ "token": "...", "user": { "id": "...", "email": "...", "role": "ADMIN", ... } }`
* `GET /api/auth/me` — Get current logged-in user profile with assigned hardware assets.

### 2. User & Department Management
* `GET /api/users` — List enterprise users (Filtered by role, department, or search).
* `GET /api/users/technicians` — List all active IT Technicians and Admins.
* `GET /api/users/departments` — List corporate departments.
* `POST /api/users` — [ADMIN] Create new user account.
* `PATCH /api/users/:id` — [ADMIN] Update user details or toggle active status.

### 3. Support Tickets
* `GET /api/tickets` — List tickets with pagination & filters (status, priority, category, tech, search).
* `POST /api/tickets` — Create new ticket.
  * Body: `{ "title": "...", "description": "...", "category": "Hardware", "priority": "High", "assetId": "..." }`
* `GET /api/tickets/:id` — Retrieve full ticket details including comments, history, attachments, and linked asset telemetry.
* `PATCH /api/tickets/:id` — [TECH/ADMIN] Update status (`Assigned`, `In Progress`, `Waiting for User`, `Resolved`), assign technician, or record root cause & solution.
* `POST /api/tickets/:id/comments` — Post comment (Employee or Tech) or internal note (Tech only).
* `POST /api/tickets/:id/attachments` — Upload screenshot/log file (multipart/form-data).
* `PATCH /api/tickets/:id/close` — [EMPLOYEE/ADMIN] Close ticket with 1-5 star satisfaction rating and feedback.

### 4. IT Assets
* `GET /api/assets` — [TECH/ADMIN] List all hardware assets in enterprise inventory.
* `GET /api/assets/my-assets` — [EMPLOYEE] List assets assigned to the authenticated employee.
* `GET /api/assets/:id` — [TECH/ADMIN] Full hardware detail, specs, maintenance history, and linked tickets.
* `POST /api/assets` — [ADMIN] Register new asset into inventory pool.
* `PATCH /api/assets/:id` — [TECH/ADMIN] Update status (`Available`, `Assigned`, `Under Maintenance`, `Broken`, `Retired`) and record action notes.

### 5. Knowledge Base
* `GET /api/knowledge-base/categories` — List all KB categories with article count.
* `GET /api/knowledge-base` — Search and filter SOP articles by category and query.
* `GET /api/knowledge-base/:id` — Read full SOP article (increments view count).
* `POST /api/knowledge-base` — [TECH/ADMIN] Create new SOP troubleshooting article.
* `PATCH /api/knowledge-base/:id` — [TECH/ADMIN] Update existing article.

### 6. Endpoint Monitoring & Alerts
* `POST /api/monitoring/health` — [AGENT] Ingest hardware heartbeat telemetry.
  * Payload: `{ "hostname": "DUY-PC", "cpu_usage": 35, "ram_usage": 68, "disk_usage": 91, ... }`
* `GET /api/monitoring/devices` — [TECH/ADMIN] List all monitored devices with Live Online/Offline status.
* `GET /api/monitoring/devices/:id/history` — [TECH/ADMIN] Historical telemetry logs for charts.
* `GET /api/monitoring/alerts` — [TECH/ADMIN] Active and resolved hardware threshold alerts.
* `PATCH /api/monitoring/alerts/:id/resolve` — [TECH/ADMIN] Mark alert resolved.

### 7. Executive Dashboard & Notifications
* `GET /api/dashboard/stats` — [TECH/ADMIN] Aggregated KPIs (Ticket counts, MTTR, Asset status, Offline devices).
* `GET /api/dashboard/charts` — [TECH/ADMIN] Category breakdown, priority distribution, 14-day trend.
* `GET /api/notifications` — Recent notifications for current user.
* `PATCH /api/notifications/:id/read` — Mark notification read.
* `POST /api/notifications/read-all` — Mark all notifications read.
