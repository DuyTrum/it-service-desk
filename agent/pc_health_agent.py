#!/usr/bin/env python3
"""
Enterprise IT Helpdesk - PC Health Check Monitoring Agent
Collects hardware telemetry (CPU, RAM, Disk, Network, System Info)
and transmits periodic heartbeats to the IT Service Desk Backend API.
"""

import os
import sys
import time
import socket
import platform
import uuid
import json
import argparse
import requests

# Fix Windows console UTF-8 output encoding
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

try:
    import psutil
except ImportError:
    print("[ERROR] 'psutil' is not installed. Run: pip install -r requirements.txt")
    sys.exit(1)

# Default Agent Configuration
DEFAULT_API_URL = os.environ.get("HELPDESK_API_URL", "http://localhost:5000/api/monitoring/health")
DEFAULT_AGENT_KEY = os.environ.get("AGENT_SECRET_KEY", "agent_secret_key_it_support_2026")
DEFAULT_INTERVAL = int(os.environ.get("AGENT_INTERVAL_SECONDS", "30"))


def get_mac_address() -> str:
    """Format the primary network interface MAC address."""
    try:
        mac_num = hex(uuid.getnode()).replace('0x', '').upper()
        mac = ':'.join(mac_num[i:i+2] for i in range(0, 12, 2))
        return mac
    except Exception:
        return "00:00:00:00:00:00"


def get_ip_address() -> str:
    """Retrieve primary IPv4 address."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def get_primary_disk_usage() -> float:
    """Get system primary drive usage percentage."""
    try:
        path = 'C:\\' if os.name == 'nt' else '/'
        return psutil.disk_usage(path).percent
    except Exception:
        return 0.0


def check_network_connectivity() -> str:
    """Check connectivity to DNS/Gateway."""
    try:
        socket.setdefaulttimeout(2)
        socket.socket(socket.AF_INET, socket.SOCK_STREAM).connect(("8.8.8.8", 53))
        return "online"
    except Exception:
        return "offline"


def collect_system_telemetry() -> dict:
    """Gather full hardware metrics payload."""
    hostname = socket.gethostname()
    os_info = f"{platform.system()} {platform.release()} ({platform.architecture()[0]})"
    cpu_usage = psutil.cpu_percent(interval=1)
    ram_usage = psutil.virtual_memory().percent
    disk_usage = get_primary_disk_usage()
    ip_addr = get_ip_address()
    mac_addr = get_mac_address()
    net_status = check_network_connectivity()
    uptime = int(time.time() - psutil.boot_time())

    return {
        "hostname": hostname,
        "os_info": os_info,
        "cpu_usage": round(cpu_usage, 2),
        "ram_usage": round(ram_usage, 2),
        "disk_usage": round(disk_usage, 2),
        "ip_address": ip_addr,
        "mac_address": mac_addr,
        "network_status": net_status,
        "uptime_seconds": uptime,
    }


def send_telemetry(api_url: str, agent_key: str, data: dict) -> bool:
    """Transmit payload to Backend API."""
    headers = {
        "Content-Type": "application/json",
        "x-agent-key": agent_key,
        "User-Agent": "IT-Helpdesk-Agent/1.0",
    }
    try:
        res = requests.post(api_url, json=data, headers=headers, timeout=5)
        if res.status_code in [200, 201]:
            resp_json = res.json()
            alerts = resp_json.get("data", {}).get("triggeredAlerts", [])
            alert_msg = f" | [ALERTS TRIGGERED: {len(alerts)}]" if alerts else ""
            print(f"[{time.strftime('%H:%M:%S')}] [SUCCESS] Telemetry sent! CPU: {data['cpu_usage']}%, RAM: {data['ram_usage']}%, Disk: {data['disk_usage']}%, IP: {data['ip_address']}{alert_msg}")
            return True
        else:
            print(f"[{time.strftime('%H:%M:%S')}] [API ERROR] ({res.status_code}): {res.text}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"[{time.strftime('%H:%M:%S')}] [WARNING] Could not reach IT Helpdesk server at {api_url}. Retrying...")
        return False
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] [ERROR] Unexpected error sending telemetry: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="IT Service Desk PC Health Monitoring Agent")
    parser.add_argument("--url", default=DEFAULT_API_URL, help="Backend API endpoint URL")
    parser.add_argument("--key", default=DEFAULT_AGENT_KEY, help="Agent secret authentication key")
    parser.add_argument("--interval", type=int, default=DEFAULT_INTERVAL, help="Heartbeat polling interval in seconds")
    parser.add_argument("--once", action="store_true", help="Send telemetry once and exit")
    args = parser.parse_args()

    print("===============================================================")
    print("  [AGENT] IT Service Desk - PC Health Check Monitoring Agent v1.0")
    print(f"  Target Endpoint: {args.url}")
    print(f"  Heartbeat Interval: {args.interval}s")
    print(f"  Machine Hostname: {socket.gethostname()}")
    print("===============================================================")

    if args.once:
        data = collect_system_telemetry()
        send_telemetry(args.url, args.key, data)
        return

    try:
        while True:
            data = collect_system_telemetry()
            send_telemetry(args.url, args.key, data)
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\n[INFO] Agent daemon stopped by user.")


if __name__ == "__main__":
    main()
