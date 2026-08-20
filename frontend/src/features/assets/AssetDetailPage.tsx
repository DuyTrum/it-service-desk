import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Asset, AssetStatus, Ticket } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import {
  ArrowLeft,
  Laptop,
  User as UserIcon,
  HardDrive,
  Cpu,
  Activity,
  History,
  Ticket as TicketIcon,
  ShieldCheck,
  Calendar,
  Wrench,
  Layers,
} from 'lucide-react';

export const AssetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Status Change Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<AssetStatus>('Available');
  const [actionNote, setActionNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const isTechOrAdmin = user?.role === 'TECHNICIAN' || user?.role === 'ADMIN';

  const fetchAsset = async () => {
    try {
      const res = await api.get(`/assets/${id}`);
      setAsset(res.data.data);
      setNewStatus(res.data.data.status);
    } catch (err) {
      console.error('Failed to fetch asset:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingStatus(true);
    try {
      await api.patch(`/assets/${id}`, {
        status: newStatus,
        actionNote: actionNote || undefined,
      });
      setIsStatusModalOpen(false);
      setActionNote('');
      fetchAsset();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update asset status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading hardware asset details...</span>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Asset not found.</p>
        <Link to="/assets" className="text-brand-400 hover:underline mt-2 inline-block text-sm">
          Return to Asset Inventory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/assets')}
            className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-brand-400 text-sm bg-brand-500/10 px-2.5 py-0.5 rounded-lg border border-brand-500/20">
                {asset.asset_code}
              </span>
              <Badge variant={asset.status as any}>{asset.status}</Badge>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-1">{asset.name}</h2>
          </div>
        </div>

        {isTechOrAdmin && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Wrench className="w-4 h-4" />}
            onClick={() => setIsStatusModalOpen(true)}
          >
            Update Lifecycle Status
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Specs, PC Health Telemetry, Related Incident History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Specifications Card */}
          <Card title="Hardware Specifications & Metadata">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Category:</span>
                  <span className="text-slate-200 font-medium">{asset.category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Manufacturer / Brand:</span>
                  <span className="text-slate-200 font-medium">{asset.brand || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Model:</span>
                  <span className="text-slate-200 font-medium">{asset.model || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Serial Number:</span>
                  <span className="text-slate-200 font-mono font-medium">{asset.serial_number || 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Physical Location:</span>
                  <span className="text-slate-200 font-medium">{asset.location || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">IP Address:</span>
                  <span className="text-slate-200 font-mono">{asset.ip_address || 'DHCP'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">MAC Address:</span>
                  <span className="text-slate-200 font-mono">{asset.mac_address || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Warranty Expiration:</span>
                  <span className="text-slate-200 font-medium">{asset.warranty_expires || 'Under Warranty'}</span>
                </div>
              </div>
            </div>

            {/* Custom Specs Payload */}
            {asset.specs && Object.keys(asset.specs).length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  System Components Breakdown
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(asset.specs).map(([k, v]) => (
                    <div key={k} className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 uppercase text-[10px] font-semibold block">{k}</span>
                      <span className="text-slate-200 font-medium">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* PC Health Telemetry from Python Agent */}
          {asset.healthLogs && asset.healthLogs.length > 0 && (
            <Card title="Live PC Health & Diagnostic Telemetry (Python Agent)" subtitle="Automated periodic endpoint monitoring">
              <div className="space-y-4 text-xs">
                {/* Latest Metric snapshot */}
                {(() => {
                  const latest = asset.healthLogs[0];
                  return (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span className="flex items-center gap-1 font-semibold">
                            <Cpu className="w-3.5 h-3.5 text-brand-400" /> CPU Usage
                          </span>
                          <span className="text-slate-200 font-bold">{latest.cpu_usage}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500" style={{ width: `${latest.cpu_usage}%` }} />
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span className="flex items-center gap-1 font-semibold">
                            <Layers className="w-3.5 h-3.5 text-purple-400" /> Memory (RAM)
                          </span>
                          <span className="text-slate-200 font-bold">{latest.ram_usage}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500" style={{ width: `${latest.ram_usage}%` }} />
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span className="flex items-center gap-1 font-semibold">
                            <HardDrive className="w-3.5 h-3.5 text-amber-400" /> Primary Disk
                          </span>
                          <span className={latest.disk_usage > 85 ? 'text-rose-400 font-bold' : 'text-slate-200 font-bold'}>
                            {latest.disk_usage}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${latest.disk_usage > 85 ? 'bg-rose-500' : 'bg-brand-500'}`}
                            style={{ width: `${latest.disk_usage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Telemetry History List */}
                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-slate-300 mb-2">Recent Heartbeat Logs</h4>
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/80 rounded-xl border border-slate-800">
                    {asset.healthLogs.slice(0, 10).map((log) => (
                      <div key={log.id} className="p-2.5 flex items-center justify-between text-[11px] bg-slate-900/60">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-400">{log.hostname}</span>
                          <span className="text-slate-300">CPU: {log.cpu_usage}%</span>
                          <span className="text-slate-300">RAM: {log.ram_usage}%</span>
                          <span className={log.disk_usage > 85 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                            Disk: {log.disk_usage}%
                          </span>
                        </div>
                        <span className="text-slate-500">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Related Support Incident History */}
          <Card title="Incident & Repair History" subtitle="Tickets historically filed against this hardware asset">
            {asset.tickets && asset.tickets.length > 0 ? (
              <div className="divide-y divide-slate-800">
                {asset.tickets.map((t) => (
                  <div key={t.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <Link to={`/tickets/${t.id}`} className="font-mono font-bold text-brand-400 hover:underline">
                        {t.ticket_code}
                      </Link>
                      <p className="font-medium text-slate-200 mt-0.5">{t.title}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={t.priority as any}>{t.priority}</Badge>
                      <Badge variant={t.status as any}>{t.status}</Badge>
                      <span className="text-slate-500 text-[11px]">
                        {new Date(t.created_at!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No past incident tickets recorded for this device.</p>
            )}
          </Card>
        </div>

        {/* Right 1 Column: Assignment, Maintenance History */}
        <div className="space-y-6">
          {/* Assignment Card */}
          <Card title="Current Allocation">
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white">
                  {asset.assigned_user_name ? asset.assigned_user_name.charAt(0) : 'P'}
                </div>
                <div>
                  <h4 className="font-semibold text-white">
                    {asset.assigned_user_name || 'Available in Inventory Pool'}
                  </h4>
                  <p className="text-slate-400">{asset.assigned_user_email || 'Not assigned to individual'}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="text-slate-200 font-medium">{asset.department_name || 'General Stock'}</span>
                </div>
                {asset.assigned_user_phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Contact Phone:</span>
                    <span className="text-slate-200 font-medium">{asset.assigned_user_phone}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Maintenance & Reassignment History Timeline */}
          <Card title="Asset Lifecycle History" subtitle="Audit trail of acquisitions, maintenance, and reassignments">
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {asset.history && asset.history.length > 0 ? (
                asset.history.map((h) => (
                  <div key={h.id} className="relative pl-5 border-l-2 border-slate-800 text-xs space-y-0.5">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-brand-400" />
                    <p className="font-semibold text-white">{h.action}</p>
                    <p className="text-slate-300 text-[11px]">{h.notes || 'Status updated'}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                      <span>By {h.performed_by_name || 'Admin'}</span>
                      <span>•</span>
                      <span>{new Date(h.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No lifecycle events logged.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal: Update Lifecycle Status */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Asset Lifecycle Status"
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1.5">New Asset Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as AssetStatus)}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-brand-500"
            >
              <option value="Available">Available (In Storage / Ready to Issue)</option>
              <option value="Assigned">Assigned (In active user operation)</option>
              <option value="Under Maintenance">Under Maintenance (In IT Repair Bench)</option>
              <option value="Broken">Broken (Awaiting RMA / Parts)</option>
              <option value="Retired">Retired (Decommissioned / Recycled)</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1.5">
              Action Notes / Maintenance Log Reason
            </label>
            <textarea
              rows={3}
              required
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              placeholder="e.g. Sent for motherboard RMA replacement due to power failure..."
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isUpdatingStatus}>
              Save Status
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
