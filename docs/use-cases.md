# Core Use Cases & Functional Scenarios

## 1. End-to-End Incident Support Lifecycle
1. **Employee Ticket Submission**:
   * Employee logs into the portal and clicks "Create Ticket".
   * Selects Category: `Hardware`, Priority: `High`, Associated Asset: `AST-LAP-001`.
   * Enters issue: "Laptop blue screens with MEMORY_MANAGEMENT error". Uploads crash dump log.
   * System assigns code `#TKT-2026-0001` with status `Open`.
2. **Technician Triage & Assignment**:
   * Real-time notification banner appears on Technician dashboard.
   * Technician clicks "Assign to Me" -> Ticket status transitions to `Assigned`.
   * Technician clicks "Start Progress" -> Ticket status transitions to `In Progress`.
   * Status change audit entries automatically saved to `ticket_history`.
3. **Investigation with Asset Integration**:
   * Technician views hardware specs on ticket panel: Intel Core i7, 16GB DDR4 RAM.
   * Technician reviews latest PC Health metrics ingested by Python Agent.
   * Technician adds Internal Note: "Minidump confirms bad RAM stick at address 0x7FFF32."
4. **Resolution & User Feedback**:
   * Technician replaces RAM, marks ticket `Resolved` with Root Cause: "Faulty RAM Module", Solution: "Replaced 8GB DDR4 RAM, MemTest86 100% pass."
   * Employee receives notification, verifies laptop works properly, rates **5 Stars** with feedback "Super fast fix!", and closes ticket.

---

## 2. Proactive PC Health Monitoring & Alerting
1. **Endpoint Daemon Execution**:
   * Python agent runs every 30 seconds on Windows workstation `DUY-PC-WORKSTATION`.
   * Agent measures: CPU: 42.5%, RAM: 68.2%, **Disk C: 91.4%**.
   * Transmits heartbeat to `POST /api/monitoring/health`.
2. **Backend Alert Engine Processing**:
   * Backend evaluates rules: `Disk Usage > 85%` threshold breached.
   * Database creates `system_alerts` record (`DISK_HIGH`, Severity: `Warning`).
   * Socket.IO emits `monitoring:alert` event to connected technicians.
3. **Technician Remediation**:
   * Technician sees the warning banner on Monitoring page.
   * Technician runs disk cleanup SOP or contacts user before system crashes.
   * Technician marks alert as resolved.
