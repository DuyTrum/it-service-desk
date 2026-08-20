# PC Health Monitoring Agent

A lightweight, cross-platform background agent developed in Python to proactively monitor endpoint workstation performance and transmit system health metrics to the **IT Service Desk & Asset Management System**.

## 🛠 Features
* Collects:
  * **CPU Utilization %**
  * **RAM Memory Usage %**
  * **Primary Storage Disk Usage %**
  * **Operating System version and architecture**
  * **MAC Address & Local IPv4 Address**
  * **Network Connectivity State (Online / Offline)**
  * **System Uptime in seconds**
* Authenticates via secure `x-agent-key` header
* Automatic threshold alerting triggered on the backend:
  * CPU > 90%
  * RAM > 90%
  * Disk > 85%
  * Missing heartbeats > 3 minutes (Device Offline)

## 🚀 Installation & Usage

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Daemon
```bash
# Periodic heartbeat (Default: every 30 seconds)
python pc_health_agent.py

# Or send a single diagnostic heartbeat
python pc_health_agent.py --once

# Custom interval and endpoint
python pc_health_agent.py --url http://192.168.1.100:5000/api/monitoring/health --interval 60
```
