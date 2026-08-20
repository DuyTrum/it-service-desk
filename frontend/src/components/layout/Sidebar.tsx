import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Laptop,
  Activity,
  BookOpen,
  Users,
  Shield,
  Layers,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'EMPLOYEE';
  const isTechOrAdmin = user?.role === 'TECHNICIAN' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-brand-600/15 text-brand-400 border border-brand-500/30 shadow-sm'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
    }`;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-wide leading-none">SERVICE DESK</h1>
          <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider">& Asset Manager</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {/* Main Menu */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Overview</p>
          <NavLink to="/dashboard" className={navItemClass}>
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </NavLink>
        </div>

        {/* Service Desk */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Service Desk</p>
          <NavLink to="/tickets" end className={navItemClass}>
            <Ticket className="w-4 h-4" />
            <span>{isEmployee ? 'My Tickets' : 'Ticket Queue'}</span>
          </NavLink>
          <NavLink to="/tickets/create" className={navItemClass}>
            <PlusCircle className="w-4 h-4" />
            <span>Create Ticket</span>
          </NavLink>
        </div>

        {/* Assets & Monitoring */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">IT Operations</p>
          <NavLink to="/assets" className={navItemClass}>
            <Laptop className="w-4 h-4" />
            <span>{isEmployee ? 'My Devices' : 'IT Assets'}</span>
          </NavLink>

          {isTechOrAdmin && (
            <NavLink to="/monitoring" className={navItemClass}>
              <Activity className="w-4 h-4" />
              <span>PC Monitoring</span>
            </NavLink>
          )}

          <NavLink to="/knowledge-base" className={navItemClass}>
            <BookOpen className="w-4 h-4" />
            <span>Knowledge Base</span>
          </NavLink>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Administration</p>
            <NavLink to="/admin/users" className={navItemClass}>
              <Users className="w-4 h-4" />
              <span>User & Roles</span>
            </NavLink>
          </div>
        )}
      </div>

      {/* User Role Badge Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-white text-xs">
            {user?.fullName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3 text-brand-400" />
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
