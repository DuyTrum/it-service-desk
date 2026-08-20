import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Asset, AssetCategory, AssetStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import {
  Laptop,
  Search,
  PlusCircle,
  Wrench,
  Activity,
  HardDrive,
  UserCheck,
  Shield,
  ArrowUpRight,
} from 'lucide-react';

export const AssetListPage: React.FC = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'EMPLOYEE';
  const isAdmin = user?.role === 'ADMIN';
  const isTechOrAdmin = user?.role === 'TECHNICIAN' || user?.role === 'ADMIN';

  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Register Asset Modal (Admin)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<AssetCategory>('Laptop');
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      if (isEmployee) {
        const res = await api.get('/assets/my-assets');
        setAssets(res.data.data);
      } else {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (statusFilter) params.append('status', statusFilter);
        if (categoryFilter) params.append('category', categoryFilter);

        const res = await api.get(`/assets?${params.toString()}`);
        setAssets(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch assets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [search, statusFilter, categoryFilter, isEmployee]);

  const handleRegisterAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/assets', {
        assetCode: newCode,
        name: newName,
        category: newCategory,
        brand: newBrand,
        model: newModel,
        serialNumber: newSerial,
        location: newLocation,
        status: 'Available',
      });
      setIsRegisterOpen(false);
      fetchAssets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to register asset');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isEmployee ? 'My Assigned Equipment' : 'IT Asset Inventory Management'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Hardware inventory, maintenance history, and device telemetry
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setIsRegisterOpen(true)}
          >
            Register New Asset
          </Button>
        )}
      </div>

      {/* Filter & Search Bar for Tech / Admin */}
      {!isEmployee && (
        <div className="bg-slate-850 border border-slate-800 p-4 rounded-xl shadow-lg flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Asset Tag, Name, Serial Number, or Model..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-44 py-2 px-3 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Assigned">Assigned</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Broken">Broken</option>
            <option value="Retired">Retired</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full md:w-44 py-2 px-3 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Categories</option>
            <option value="Laptop">Laptop</option>
            <option value="Desktop">Desktop</option>
            <option value="Monitor">Monitor</option>
            <option value="Printer">Printer</option>
            <option value="Network Device">Network Device</option>
            <option value="Other">Other</option>
          </select>
        </div>
      )}

      {/* Assets Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-5 py-3.5">Asset Code</th>
                <th className="px-5 py-3.5">Device Name & Model</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Serial Number</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Assigned To</th>
                <th className="px-5 py-3.5">Health / Disk</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading asset inventory...</span>
                    </div>
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No IT assets found.
                  </td>
                </tr>
              ) : (
                assets.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="px-5 py-4 font-mono font-bold text-brand-400 whitespace-nowrap">
                      <Link to={`/assets/${a.id}`} className="hover:underline">
                        {a.asset_code}
                      </Link>
                    </td>

                    <td className="px-5 py-4 min-w-[200px]">
                      <Link to={`/assets/${a.id}`} className="hover:text-brand-300 font-medium text-slate-100 block">
                        {a.name}
                      </Link>
                      <span className="text-[11px] text-slate-400">
                        {a.brand} {a.model}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-slate-300">{a.category}</td>

                    <td className="px-5 py-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {a.serial_number || 'N/A'}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <Badge variant={a.status as any}>{a.status}</Badge>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-slate-300">
                      {a.assigned_user_name ? (
                        <div>
                          <div>{a.assigned_user_name}</div>
                          <div className="text-[10px] text-slate-400">{a.department_name}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unassigned (Pool)</span>
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {a.last_disk !== undefined ? (
                        <div className="space-y-1 w-24">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400">Disk C:</span>
                            <span className={a.last_disk > 85 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                              {a.last_disk}%
                            </span>
                          </div>
                          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${a.last_disk > 85 ? 'bg-rose-500' : 'bg-brand-500'}`}
                              style={{ width: `${a.last_disk}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">No Agent</span>
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <Link
                        to={`/assets/${a.id}`}
                        className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-semibold"
                      >
                        Details <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Register New Asset (Admin) */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register New IT Hardware Asset"
      >
        <form onSubmit={handleRegisterAsset} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Asset Tag / Code *</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="e.g. AST-LAP-009"
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Category *</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as AssetCategory)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="Laptop">Laptop</option>
                <option value="Desktop">Desktop</option>
                <option value="Monitor">Monitor</option>
                <option value="Printer">Printer</option>
                <option value="Network Device">Network Device</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Asset Name *</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Dell Latitude 5430 Core i7"
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Brand</label>
              <input
                type="text"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="e.g. Dell / HP / Apple"
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Model</label>
              <input
                type="text"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="e.g. Latitude 5430"
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Serial Number</label>
              <input
                type="text"
                value={newSerial}
                onChange={(e) => setNewSerial(e.target.value)}
                placeholder="e.g. DL5430-9988X"
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Location</label>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="e.g. Floor 3 Main Office"
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRegisterOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Asset
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
