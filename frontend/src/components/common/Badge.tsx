import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'open'
    | 'assigned'
    | 'in_progress'
    | 'waiting'
    | 'resolved'
    | 'closed'
    | 'critical'
    | 'high'
    | 'medium'
    | 'low'
    | 'available'
    | 'maintenance'
    | 'broken'
    | 'retired'
    | 'online'
    | 'offline'
    | 'default';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const variantStyles: Record<string, string> = {
    // Statuses
    open: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    assigned: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    waiting: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    closed: 'bg-slate-500/10 text-slate-400 border-slate-500/30',

    // Priorities
    critical: 'bg-rose-500/15 text-rose-400 border-rose-500/40 font-semibold',
    high: 'bg-orange-500/15 text-orange-400 border-orange-500/40 font-medium',
    medium: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    low: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',

    // Assets
    available: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    maintenance: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    broken: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    retired: 'bg-slate-600/15 text-slate-400 border-slate-600/30',

    // Monitoring
    online: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    offline: 'bg-rose-500/10 text-rose-400 border-rose-500/30',

    default: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const currentStyle = variantStyles[variant.toLowerCase().replace(/ /g, '_')] || variantStyles.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentStyle} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {children}
    </span>
  );
};
