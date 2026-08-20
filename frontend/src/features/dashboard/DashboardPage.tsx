import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { DashboardStats, Ticket, Asset, SystemAlert } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Link } from 'react-router-dom';
import {
  Ticket as TicketIcon,
  Clock,
  Laptop,
  AlertTriangle,
  CheckCircle2,
  Activity,
  PlusCircle,
  BookOpen,
  ArrowUpRight,
  HardDrive,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'EMPLOYEE';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<any>(null);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [myAssets, setMyAssets] = useState<Asset[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        if (isEmployee) {
          const [ticketsRes, assetsRes] = await Promise.all([
            api.get('/tickets?limit=5'),
            api.get('/assets/my-assets'),
          ]);
          setMyTickets(ticketsRes.data.data.tickets || []);
          setMyAssets(assetsRes.data.data || []);
        } else {
          const [statsRes, chartsRes, alertsRes, ticketsRes] = await Promise.all([
            api.get('/dashboard/stats'),
            api.get('/dashboard/charts'),
            api.get('/monitoring/alerts?isResolved=false'),
            api.get('/tickets?limit=5'),
          ]);
          setStats(statsRes.data.data);
          setCharts(chartsRes.data.data);
          setActiveAlerts(alertsRes.data.data || []);
          setMyTickets(ticketsRes.data.data.tickets || []);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [isEmployee]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Dashboard Analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Welcome back, {user?.fullName} 👋
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isEmployee
              ? `Department: ${user?.departmentName || 'General'} | View your open service tickets and assigned hardware.`
              : `Service Desk Operations Center | Active monitoring and support incident triage.`}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/tickets/create">
            <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Create Ticket
            </Button>
          </Link>
          <Link to="/knowledge-base">
            <Button variant="secondary" size="sm" leftIcon={<BookOpen className="w-4 h-4" />}>
              Knowledge Base
            </Button>
          </Link>
        </div>
      </div>

      {/* Active System Health Alert Banner for Tech & Admin */}
      {!isEmployee && activeAlerts.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-300">
              Proactive Hardware Alerts Detected ({activeAlerts.length})
            </h4>
            <div className="mt-1 space-y-1">
              {activeAlerts.slice(0, 2).map((alert) => (
                <p key={alert.id} className="text-xs text-amber-200/80">
                  • <span className="font-semibold text-amber-100">{alert.message}</span>
                </p>
              ))}
            </div>
          </div>
          <Link to="/monitoring">
            <Button variant="outline" size="sm" className="border-amber-500/40 text-amber-300 hover:bg-amber-500/20">
              View PC Health
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Metric Cards */}
      {!isEmployee && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Open Incidents"
            value={stats.tickets.open + stats.tickets.inProgress}
            subtitle={`${stats.tickets.open} unassigned, ${stats.tickets.inProgress} in-progress`}
            icon={<TicketIcon className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Critical Priority"
            value={stats.tickets.criticalOpen}
            subtitle="Requires immediate SLA response"
            icon={<AlertTriangle className="w-6 h-6" />}
            color={stats.tickets.criticalOpen > 0 ? 'rose' : 'emerald'}
          />
          <StatCard
            title="Mean Time To Resolve"
            value={`${stats.tickets.avgResolutionHours} hrs`}
            subtitle={`Avg Rating: ⭐ ${stats.tickets.avgRating}/5.0`}
            icon={<Clock className="w-6 h-6" />}
            color="purple"
          />
          <StatCard
            title="Monitored Devices"
            value={stats.monitoring.totalMonitored}
            subtitle={`${stats.monitoring.offlineDevices} offline, ${stats.monitoring.highDiskDevices} disk warnings`}
            icon={<Activity className="w-6 h-6" />}
            color={stats.monitoring.highDiskDevices > 0 ? 'amber' : 'emerald'}
          />
        </div>
      )}

      {/* Employee Specific KPI Cards */}
      {isEmployee && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="My Open Tickets"
            value={myTickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed').length}
            subtitle="Currently under IT review"
            icon={<TicketIcon className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Resolved Tickets"
            value={myTickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length}
            subtitle="Successfully completed"
            icon={<CheckCircle2 className="w-6 h-6" />}
            color="emerald"
          />
          <StatCard
            title="Assigned Devices"
            value={myAssets.length}
            subtitle="Workstation & Peripherals"
            icon={<Laptop className="w-6 h-6" />}
            color="purple"
          />
        </div>
      )}

      {/* Charts & Analytical Breakdowns for Tech & Admin */}
      {!isEmployee && charts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incidents by Category */}
          <Card title="Incidents by Category" subtitle="Distribution of support requests">
            <div className="space-y-3">
              {charts.ticketsByCategory.map((c: any) => {
                const total = stats?.tickets.total || 1;
                const pct = Math.round((parseInt(c.count, 10) / total) * 100);
                return (
                  <div key={c.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-300">{c.category}</span>
                      <span className="text-slate-400">{c.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Incidents by Priority */}
          <Card title="Tickets by Priority" subtitle="Current queue urgency level">
            <div className="space-y-3">
              {charts.ticketsByPriority.map((p: any) => (
                <div key={p.priority} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Badge variant={p.priority as any}>{p.priority}</Badge>
                  </div>
                  <span className="text-sm font-bold text-white">{p.count} tickets</span>
                </div>
              ))}
            </div>
          </Card>

          {/* IT Asset Lifecycle Status */}
          <Card title="Asset Lifecycle Summary" subtitle="Inventory health breakdown">
            <div className="space-y-3">
              {charts.assetsByStatus.map((s: any) => (
                <div key={s.status} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <Badge variant={s.status as any}>{s.status}</Badge>
                  <span className="text-sm font-bold text-white">{s.count} devices</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Employee Assigned Hardware Overview */}
      {isEmployee && myAssets.length > 0 && (
        <Card title="My Assigned Equipment" subtitle="Hardware currently issued to your account">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myAssets.map((asset) => (
              <div key={asset.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
                      {asset.asset_code}
                    </span>
                    <h4 className="text-sm font-semibold text-white mt-1">{asset.name}</h4>
                    <p className="text-xs text-slate-400">{asset.brand} {asset.model}</p>
                  </div>
                  <Badge variant={asset.status as any}>{asset.status}</Badge>
                </div>

                {asset.last_disk !== undefined && (
                  <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Drive C: Disk Usage</span>
                      <span className={asset.last_disk > 85 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {asset.last_disk}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          asset.last_disk > 85 ? 'bg-rose-500' : 'bg-brand-500'
                        }`}
                        style={{ width: `${asset.last_disk}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Support Tickets Table */}
      <Card
        title={isEmployee ? 'My Recent Support Tickets' : 'Active Ticket Queue'}
        subtitle="Latest service requests submitted to the desk"
        action={
          <Link to="/tickets" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-semibold">
            View all tickets <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Code</th>
                <th className="pb-3 font-semibold">Title & Problem</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Priority</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Assignee</th>
                <th className="pb-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {myTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No tickets found.
                  </td>
                </tr>
              ) : (
                myTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3 font-mono font-bold text-brand-400">
                      <Link to={`/tickets/${t.id}`} className="hover:underline">
                        {t.ticket_code}
                      </Link>
                    </td>
                    <td className="py-3 font-medium text-slate-200 max-w-xs truncate">
                      <Link to={`/tickets/${t.id}`} className="hover:text-brand-300">
                        {t.title}
                      </Link>
                    </td>
                    <td className="py-3 text-slate-400">{t.category}</td>
                    <td className="py-3">
                      <Badge variant={t.priority as any}>{t.priority}</Badge>
                    </td>
                    <td className="py-3">
                      <Badge variant={t.status as any}>{t.status}</Badge>
                    </td>
                    <td className="py-3 text-slate-300">
                      {t.tech_name || <span className="text-slate-500 italic">Unassigned</span>}
                    </td>
                    <td className="py-3 text-slate-400 whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
