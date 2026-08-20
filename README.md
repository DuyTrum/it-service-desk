# IT Service Desk & Asset Management System

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-336791.svg)](https://www.postgresql.org)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-black.svg)](https://socket.io)
[![Python](https://img.shields.io/badge/Python-3.11-yellow.svg)](https://www.python.org)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg)](https://www.docker.com)

A production-grade, enterprise-scale **IT Service Desk & IT Asset Management Platform** designed to simulate modern corporate IT Support operations. Featuring SLA incident workflows, hardware inventory lifecycle tracking, 15 structured Knowledge Base Standard Operating Procedures (SOPs), real-time WebSocket notifications, and an autonomous **Python PC Health Check Monitoring Agent**.

---

## 🌟 Key Highlights & Business Capabilities

1. **Incident & Ticket Lifecycle Management**:
   * Multi-stage status transitions: `Open` ➔ `Assigned` ➔ `In Progress` ➔ (`Waiting for User` ⇆ `In Progress`) ➔ `Resolved` ➔ `Closed`.
   * Real-time automated audit trail logging in `ticket_history`.
   * Collaborative two-way threaded discussion with internal technician notes (hidden from employees).
   * 1–5 star satisfaction rating and feedback collection upon ticket closure.

2. **IT Asset Management & Hardware Integration**:
   * Complete lifecycle tracking: `Available`, `Assigned`, `Under Maintenance`, `Broken`, `Retired`.
   * Deep Ticket & Asset Integration: Directly link incidents to hardware, inspect hardware specifications (CPU, RAM, Storage, Serial No, Warranty), and view past repair history.
   * Automated asset status synchronization with maintenance repair bench workflows.

3. **Autonomous Python PC Health Agent**:
   * Background monitoring daemon utilizing `psutil` to collect CPU, RAM, primary disk usage %, network connectivity, MAC address, and uptime.
   * Proactive Backend Alert Rule Engine:
     * `Disk Usage > 85%` ➔ Triggers high storage warning alert
     * `CPU Usage > 90%` ➔ Triggers critical processor warning
     * `RAM Usage > 90%` ➔ Triggers memory exhaustion alert
     * `Missing Heartbeat > 3 mins` ➔ Triggers Device Offline warning

4. **15 Enterprise Knowledge Base (KB) SOPs**:
   * Standard Operating Procedures covering Network, Hardware, Printing, Software, and Identity/Access.
   * Structured problem description, symptoms, probable causes, interactive checklist steps, and escalation conditions.

5. **Executive Analytics Dashboard & Real-Time Socket.IO**:
   * Aggregated KPIs: Total Tickets, Open/Critical Incidents, Mean Time To Resolve (MTTR in hours), Monitored Endpoints.
   * Real-time WebSocket event broadcasting for instant ticket triage and hardware alert popups.

---

## 🏛️ System Architecture

```
                        ┌──────────────────────┐
                        │      Employees       │
                        │    IT Technicians    │
                        │       Admins         │
                        └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │    React Frontend    │
                        │    TypeScript        │
                        └──────────┬───────────┘
                                   │
                              REST API
                              WebSocket
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │   Node.js Backend    │
                        │     Express API      │
                        └───────┬───────┬──────┘
                                │       │
                                │       │
                         PostgreSQL   Socket.IO
                                │
                                ▼
                        ┌──────────────────────┐
                        │      Database        │
                        └──────────────────────┘


PC / Laptop
     │
     │ Python Health Agent (psutil)
     │
     ▼
┌──────────────────────┐
│ System Health API    │
└──────────────────────┘
```

---

## 🚀 Quick Start Guide

### 1. Start PostgreSQL (Docker)
```bash
docker compose up -d
```

### 2. Start Backend API
```bash
cd backend
npm install
npm run migrate   # Run database migrations
npm run seed      # Seed realistic enterprise data
npm run dev       # Starts Express API at http://localhost:5000
```

### 3. Start Frontend SPA
```bash
cd frontend
npm install
npm run dev       # Starts Vite React dev server at http://localhost:5173
```

### 4. Run Python Endpoint Agent
```bash
cd agent
pip install -r requirements.txt
python pc_health_agent.py --interval 30
```

---

## 👥 Demo Credentials

| Role | Email | Password | Primary Use Case |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@company.local` | `Admin@123` | Full control (Users, Roles, Assets, Reports) |
| **IT Technician** | `tech.duy@company.local` | `Tech@123` | Ticket Queue, Asset Maintenance, PC Monitoring |
| **Employee** | `emp.nam@company.local` | `Emp@123` | Create Tickets, View My Devices, Knowledge Base |

---

## 📚 Technical Documentation Directory
* [Architecture Design](file:///d:/Process_IT_2022-2027/IT_Helpdesk/docs/architecture.md)
* [REST API Specification](file:///d:/Process_IT_2022-2027/IT_Helpdesk/docs/api.md)
* [Database ERD & Schemas](file:///d:/Process_IT_2022-2027/IT_Helpdesk/docs/database.md)
* [Use Cases & Scenarios](file:///d:/Process_IT_2022-2027/IT_Helpdesk/docs/use-cases.md)
* [Troubleshooting SOP Workflows](file:///d:/Process_IT_2022-2027/IT_Helpdesk/docs/troubleshooting-workflows.md)
* [Deployment Guide](file:///d:/Process_IT_2022-2027/IT_Helpdesk/docs/deployment.md)

---

## 💼 Resume & CV Project Summary
**IT Service Desk & Asset Management System** | React, TypeScript, Node.js, Express, PostgreSQL, Python, Docker
* Engineered an enterprise-style IT Service Desk platform managing end-to-end technical incident triage, SLA workflows, and audit trails.
* Built an IT Asset Management module tracking hardware lifecycle, device configurations, maintenance history, and linked support tickets.
* Implemented strict Role-Based Access Control (RBAC) across Employees, IT Technicians, and Administrators using JWT authentication.
* Developed a cross-platform Python endpoint monitoring agent utilizing `psutil` to ingest real-time CPU, RAM, disk, and network telemetry.
* Architected proactive alert rule engines and Socket.IO WebSocket channels for instant incident triage and hardware fault detection.
