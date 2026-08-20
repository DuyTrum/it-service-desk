import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DeviceTelemetry, SystemAlert } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import {
  Activity,
  Cpu,
  HardDrive,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Terminal,
  RefreshCw,
  Wifi,
  Laptop,
} from 'lucide-react';

export const MonitoringPage: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
  const [deviceHistory, setDeviceHistory] = useState<DeviceTelemetry[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const fetchMonitoringData = async () => {
    setIsLoading(true);
    try {
      const [devicesRes, alertsRes] = await Promise.all([
        api.get('/monitoring/devices'),
        api.get('/monitoring/alerts?isResolved=false'),
      ]);
      setDevices(devicesRes.data.data);
      setAlerts(alertsRes.data.data);
    } catch (err) {
      console.error('Failed to fetch monitoring data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 15000); // 15s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleResolveAlert = async (alertId: string) => {
    try {
      await api.patch(`/monitoring/alerts/${alertId}/resolve`);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to resolve alert');
    }
  };

  const handleViewDeviceHistory = async (device: any) => {
    setSelectedDevice(device);
    setIsHistoryLoading(true);
    try {
      const res = await api.get(`/monitoring/devices/${device.asset_id || device.hostname}/history`);
      setDeviceHistory(res.data.data);
    } catch (err) {
      console.error('Failed to load device history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const onlineDevicesCount = devices.filter((d) => d.live_status === 'Online').length;
  const highDiskCount = devices.filter((d) => d.disk_usage > 85).length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Workstation Health & Telemetry Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time proactive hardware telemetry ingested from Windows PC Agents
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={fetchMonitoringData}
        >
          Refresh Telemetry
        </Button>
      </div>

      {/* Monitoring Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monitored Devices"
          value={devices.length}
          subtitle="Endpoints actively registered"
          icon={<Laptop className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Online Heartbeats"
          value={onlineDevicesCount}
          subtitle={`${devices.length - onlineDevicesCount} currently offline`}
          icon={<Wifi className="w-6 h-6" />}
          color="emerald"
        />
        <StatCard
          title="Active System Alerts"
          value={alerts.length}
          subtitle="Threshold violations pending action"
          icon={<AlertTriangle className="w-6 h-6" />}
          color={alerts.length > 0 ? 'rose' : 'emerald'}
        />
        <StatCard
          title="High Disk Warnings"
          value={highDiskCount}
          subtitle="Drive C: utilization > 85%"
          icon={<HardDrive className="w-6 h-6" />}
          color={highDiskCount > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* Active System Alerts Banner / Section */}
      {alerts.length > 0 && (
        <Card title={`Active Hardware Alerts (${alerts.length})`} subtitle="Actionable system warnings requiring technician attention">
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={alert.severity.toLowerCase() as any}>{alert.severity}</Badge>
                      <span className="font-semibold text-white text-xs">{alert.alert_type}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{alert.message}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Triggered on {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  onClick={() => handleResolveAlert(alert.id)}
                >
                  Mark as Resolved
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Monitored Devices Grid / Table */}
      <Card title="Live Monitored Workstations" subtitle="Real-time CPU, RAM, and Disk utilization per machine">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="pb-3">Hostname & OS</th>
                <th className="pb-3">Assigned User</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">CPU Usage</th>
                <th className="pb-3">Memory (RAM)</th>
                <th className="pb-3">Storage (Disk)</th>
                <th className="pb-3">IP / MAC</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      <span>Polling device heartbeats...</span>
                    </div>
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No workstations reporting telemetry yet. Start the Python Agent on an endpoint.
                  </td>
                </tr>
              ) : (
                devices.map((d) => (
                  <tr key={d.hostname} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4">
                      <span className="font-mono font-bold text-white block">{d.hostname}</span>
                      <span className="text-[10px] text-slate-400">{d.os_info}</span>
                    </td>

                    <td className="py-4 text-slate-300">
                      <div>{d.assigned_user_name || 'Unassigned'}</div>
                      <div className="text-[10px] text-slate-400">{d.department_name}</div>
                    </td>

                    <td className="py-4">
                      <Badge variant={d.live_status === 'Online' ? 'online' : 'offline'}>
                        {d.live_status}
                      </Badge>
                    </td>

                    <td className="py-4 w-28">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">CPU</span>
                          <span className="font-semibold text-slate-200">{d.cpu_usage}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${d.cpu_usage > 90 ? 'bg-rose-500' : 'bg-brand-500'}`}
                            style={{ width: `${d.cpu_usage}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-4 w-28">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">RAM</span>
                          <span className="font-semibold text-slate-200">{d.ram_usage}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${d.ram_usage > 90 ? 'bg-rose-500' : 'bg-purple-500'}`}
                            style={{ width: `${d.ram_usage}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-4 w-28">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Disk C:</span>
                          <span className={`font-semibold ${d.disk_usage > 85 ? 'text-rose-400 font-bold' : 'text-slate-200'}`}>
                            {d.disk_usage}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${d.disk_usage > 85 ? 'bg-rose-500' : 'bg-amber-500'}`}
                            style={{ width: `${d.disk_usage}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-4 font-mono text-[10px] text-slate-400">
                      <div>{d.ip_address}</div>
                      <div>{d.mac_address}</div>
                    </td>

                    <td className="py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDeviceHistory(d)}
                      >
                        History
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Agent Setup Instructions Card */}
      <Card title="Python Agent Endpoint Installation" subtitle="Deploying the background health daemon on Windows workstations">
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            The Python agent collects hardware telemetry every 30 seconds and posts to <code className="text-brand-400 font-mono">/api/monitoring/health</code>.
          </p>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 flex items-center justify-between">
            <code>python agent/pc_health_agent.py --interval 30</code>
            <span className="text-[10px] text-slate-400">Port 5000</span>
          </div>
        </div>
      </Card>

      {/* Modal: Device Telemetry History */}
      <Modal
        isOpen={!!selectedDevice}
        onClose={() => setSelectedDevice(null)}
        title={`Telemetry History: ${selectedDevice?.hostname}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {isHistoryLoading ? (
            <div className="py-8 text-center text-slate-400">Loading historical telemetry...</div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800 rounded-xl border border-slate-800">
              {deviceHistory.map((h) => (
                <div key={h.id} className="p-3 flex items-center justify-between bg-slate-900/60 text-[11px]">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-300">CPU: <b className="text-white">{h.cpu_usage}%</b></span>
                    <span className="text-slate-300">RAM: <b className="text-white">{h.ram_usage}%</b></span>
                    <span className={h.disk_usage > 85 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                      Disk: <b>{h.disk_usage}%</b>
                    </span>
                  </div>
                  <span className="text-slate-500 font-mono">
                    {new Date(h.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
