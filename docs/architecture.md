# System Architecture Specification

## 1. Overview
The **IT Service Desk & Asset Management System** is an enterprise-grade internal platform architected as a high-performance Modular Monolith with real-time bidirectional WebSocket events and autonomous endpoint health monitoring.

```
┌──────────────────────────────────────────────────────────┐
│                   CLIENT LAYER                           │
│  • React 18 SPA (TypeScript + Vite + Tailwind CSS)       │
│  • Role Views: Employee Portal | Tech Queue | Admin Panel│
│  • Real-time Socket.IO Client (Toast & In-app Alerts)    │
└────────────────────────────┬─────────────────────────────┘
                             │ HTTPS / REST API
                             │ WSS / WebSocket (Socket.IO)
                             ▼
┌──────────────────────────────────────────────────────────┐
│                 APPLICATION BACKEND                      │
│  • Node.js + Express.js + TypeScript (Modular Monolith)  │
│  • JWT Authentication & RBAC Authorization Middleware    │
│  • Alert Threshold Evaluation Engine                     │
│  • File Upload & Storage Subsystem                       │
└────────────────────────────┬─────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▲ JSON Telemetry
┌───────────────────────────┐     ┌───────────┴────────────┐
│   POSTGRESQL DATABASE     │     │  PYTHON PC HEALTH AGENT│
│   • 14 Normalized Tables  │     │  • Background Daemon   │
│   • Connection Pool (pg)  │     │  • psutil Hardware Mon │
│   • Audit & Metric Logs   │     │  • Alert Thresholds    │
└───────────────────────────┘     └────────────────────────┘
```

## 2. Layered Responsibilities
1. **Frontend Presentation (React + TypeScript + Tailwind CSS)**:
   * Enterprise UI optimized for rapid triage and keyboard accessibility.
   * Context-driven Auth and Socket state providers.
   * Role-based view rendering (Employee vs. IT Technician vs. Admin).
2. **Backend API Gateway & Business Layer (Express + TypeScript)**:
   * Modular domain structure: `auth`, `users`, `tickets`, `assets`, `knowledge-base`, `monitoring`, `dashboard`, `notifications`.
   * Strict input validation with Zod schemas.
   * Transactional guarantees for multi-table operations (Ticket + Ticket History + Asset Status).
3. **Autonomous PC Health Monitoring (Python Agent)**:
   * Cross-platform daemon running as a Windows service / background process.
   * Reads CPU, RAM, Disk, MAC, IP, and Network connectivity via `psutil`.
   * Periodic heartbeat transmission to `/api/monitoring/health`.
4. **Data Persistence (PostgreSQL)**:
   * Relational integrity with Foreign Keys and CASCADE/SET NULL constraints.
   * Optimized B-tree indexes on lookup fields (`email`, `ticket_code`, `status`, `priority`, `asset_code`, `hostname`).
