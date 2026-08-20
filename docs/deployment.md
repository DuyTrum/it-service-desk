# Deployment & Installation Guide

## Prerequisites
* **Node.js**: v18.0.0+ (v20+ recommended)
* **npm**: v9.0.0+
* **Docker & Docker Compose**: For PostgreSQL
* **Python**: v3.8+ (For PC Health Agent)

---

## 1. Start PostgreSQL Database
```bash
docker compose up -d
```
PostgreSQL runs on port `5433` (mapped from container port 5432) with database `it_helpdesk`.

---

## 2. Backend Setup
```bash
cd backend
npm install
npm run migrate   # Applies 14 normalized schema tables
npm run seed      # Populates enterprise users, assets, KB articles, and tickets
npm run dev       # Starts Express API on port 5000
```

---

## 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev       # Starts Vite React dev server on http://localhost:5173
```

---

## 4. Run Python PC Health Agent
```bash
cd agent
pip install -r requirements.txt
python pc_health_agent.py
```

---

## Demo Login Accounts

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@company.local` | `Admin@123` | Full access (Users, Assets, Tickets, KB, Dashboard) |
| **IT Technician** | `tech.duy@company.local` | `Tech@123` | Ticket Queue, Asset Maintenance, PC Monitoring, KB |
| **Employee** | `emp.nam@company.local` | `Emp@123` | Create Tickets, View My Assets, Read KB, Rate Support |
