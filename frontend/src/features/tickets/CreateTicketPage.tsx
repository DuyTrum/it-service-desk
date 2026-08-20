import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Asset, TicketCategory, TicketPriority } from '../../types';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import {
  Send,
  Laptop,
  Wifi,
  Printer,
  Key,
  HelpCircle,
  Paperclip,
  ArrowLeft,
} from 'lucide-react';

export const CreateTicketPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('Hardware');
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [assetId, setAssetId] = useState<string>('');
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const endpoint = user?.role === 'EMPLOYEE' ? '/assets/my-assets' : '/assets';
        const res = await api.get(endpoint);
        const assets = res.data.data.assets || res.data.data;
        setAvailableAssets(assets);
        if (assets.length > 0) {
          setAssetId(assets[0].id);
        }
      } catch (err) {
        console.error('Failed to load assets:', err);
      }
    };
    loadAssets();
  }, [user]);

  const categories: { name: TicketCategory; icon: any; desc: string }[] = [
    { name: 'Hardware', icon: Laptop, desc: 'Laptop, PC, Monitor, Keyboard, Mouse' },
    { name: 'Software', icon: HelpCircle, desc: 'Office 365, ERP, OS, Crashes' },
    { name: 'Network', icon: Wifi, desc: 'Wi-Fi, Ethernet, VPN, Internet' },
    { name: 'Printer', icon: Printer, desc: 'Canon, HP, Paper jam, Offline' },
    { name: 'Account & Access', icon: Key, desc: 'Login, Password reset, Permissions' },
    { name: 'Other', icon: HelpCircle, desc: 'General inquiries and requests' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Create Ticket
      const res = await api.post('/tickets', {
        title,
        description,
        category,
        priority,
        assetId: assetId || null,
      });

      const newTicket = res.data.data;

      // 2. Upload attachment if attached
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        await api.post(`/tickets/${newTicket.id}/attachments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      navigate(`/tickets/${newTicket.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit support ticket.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/tickets')}
          className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Create IT Support Ticket</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Submit an incident or service request to the IT Helpdesk team
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection Grid */}
        <Card title="1. Select Incident Category">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((c) => {
              const Icon = c.icon;
              const isSelected = category === c.name;
              return (
                <button
                  type="button"
                  key={c.name}
                  onClick={() => setCategory(c.name)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-brand-600/15 border-brand-500 text-brand-400 shadow-md shadow-brand-500/10'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-brand-400' : 'text-slate-400'}`} />
                  <p className="text-xs font-bold text-white">{c.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{c.desc}</p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Problem Information */}
        <Card title="2. Problem Details">
          <div className="space-y-4 text-xs">
            {/* Title */}
            <div>
              <label className="block font-medium text-slate-300 mb-1.5">
                Summary Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Laptop blue screen crash when opening financial reports"
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block font-medium text-slate-300 mb-1.5">
                Detailed Description of Symptoms & Steps to Reproduce <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe what happened, any error messages displayed, and what you were doing right before the issue occurred..."
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Priority */}
              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  Severity & Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Low">Low — Minor issue, non-urgent</option>
                  <option value="Medium">Medium — Standard office issue</option>
                  <option value="High">High — Significant business impact</option>
                  <option value="Critical">Critical — Work completely halted</option>
                </select>
              </div>

              {/* Associated Asset */}
              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  Associated Hardware Asset (Optional)
                </label>
                <select
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">-- No specific hardware linked --</option>
                  {availableAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.asset_code} — {a.name} ({a.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* File Attachment */}
            <div>
              <label className="block font-medium text-slate-300 mb-1.5">
                Screenshot or Error Log File (Optional)
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 text-xs font-medium transition-colors">
                  <Paperclip className="w-4 h-4 text-brand-400" />
                  <span>Choose File...</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    accept="image/*,.pdf,.txt,.zip"
                  />
                </label>
                {file && (
                  <span className="text-xs text-slate-300 font-mono truncate max-w-xs">
                    {file.name} ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Submit Bar */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => navigate('/tickets')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Submit Support Request
          </Button>
        </div>
      </form>
    </div>
  );
};
