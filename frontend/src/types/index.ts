export type RoleName = 'EMPLOYEE' | 'TECHNICIAN' | 'ADMIN';

export type TicketCategory =
  | 'Hardware'
  | 'Software'
  | 'Network'
  | 'Printer'
  | 'Account & Access'
  | 'Email'
  | 'Other';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type TicketStatus =
  | 'Open'
  | 'Assigned'
  | 'In Progress'
  | 'Waiting for User'
  | 'Resolved'
  | 'Closed';

export type AssetCategory =
  | 'Desktop'
  | 'Laptop'
  | 'Monitor'
  | 'Printer'
  | 'Keyboard'
  | 'Mouse'
  | 'Network Device'
  | 'Other';

export type AssetStatus =
  | 'Available'
  | 'Assigned'
  | 'Under Maintenance'
  | 'Broken'
  | 'Retired';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  jobTitle?: string;
  role: RoleName;
  roleId: number;
  departmentId?: string;
  departmentName?: string;
  assignedAssets?: AssetSummary[];
}

export interface AssetSummary {
  id: string;
  asset_code: string;
  name: string;
  category: AssetCategory;
  model?: string;
  status: AssetStatus;
}

export interface Ticket {
  id: string;
  ticket_code: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  created_by_user_id: string;
  creator_name: string;
  creator_email: string;
  creator_phone?: string;
  assigned_tech_id?: string;
  tech_name?: string;
  tech_email?: string;
  asset_id?: string;
  asset_code?: string;
  asset_name?: string;
  asset_category?: string;
  asset_model?: string;
  asset_serial?: string;
  asset_status?: string;
  asset_specs?: Record<string, any>;
  department_id?: string;
  department_name?: string;
  resolution_notes?: string;
  root_cause?: string;
  satisfaction_rating?: number;
  feedback_comment?: string;
  resolved_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
  comment_count?: number;
  attachment_count?: number;
  comments?: TicketComment[];
  history?: TicketHistoryItem[];
  attachments?: TicketAttachment[];
  assetTelemetry?: DeviceTelemetry | null;
}

export interface TicketComment {
  id: string;
  comment: string;
  is_internal_note: boolean;
  user_id: string;
  user_name: string;
  user_email: string;
  role_name: RoleName;
  created_at: string;
}

export interface TicketHistoryItem {
  id: string;
  field_changed: string;
  old_value?: string;
  new_value?: string;
  comment?: string;
  changed_by_name?: string;
  changed_by_role?: string;
  created_at: string;
}

export interface TicketAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by_name?: string;
  created_at: string;
}

export interface Asset {
  id: string;
  asset_code: string;
  name: string;
  category: AssetCategory;
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  warranty_expires?: string;
  status: AssetStatus;
  assigned_user_id?: string;
  assigned_user_name?: string;
  assigned_user_email?: string;
  assigned_user_phone?: string;
  department_id?: string;
  department_name?: string;
  location?: string;
  ip_address?: string;
  mac_address?: string;
  specs?: Record<string, any>;
  notes?: string;
  ticket_count?: number;
  active_alert_count?: number;
  last_cpu?: number;
  last_ram?: number;
  last_disk?: number;
  last_network_status?: string;
  last_telemetry_at?: string;
  history?: AssetHistoryItem[];
  tickets?: Partial<Ticket>[];
  healthLogs?: DeviceTelemetry[];
  alerts?: SystemAlert[];
  created_at: string;
  updated_at: string;
}

export interface AssetHistoryItem {
  id: string;
  action: string;
  performed_by_name?: string;
  target_user_name?: string;
  notes?: string;
  created_at: string;
}

export interface DeviceTelemetry {
  id: string;
  asset_id?: string;
  hostname: string;
  os_info?: string;
  cpu_usage: number;
  ram_usage: number;
  disk_usage: number;
  ip_address?: string;
  mac_address?: string;
  network_status: string;
  uptime_seconds: number;
  created_at: string;
}

export interface SystemAlert {
  id: string;
  asset_id?: string;
  asset_code?: string;
  asset_name?: string;
  assigned_user?: string;
  alert_type: string;
  severity: 'Info' | 'Warning' | 'Critical';
  message: string;
  is_resolved: boolean;
  resolved_by_name?: string;
  resolved_at?: string;
  created_at: string;
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
  article_count?: number;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category_id: string;
  category_name?: string;
  category_icon?: string;
  problem_description: string;
  symptoms?: string;
  possible_causes?: string;
  troubleshooting_steps: string[];
  escalation_condition?: string;
  author_name?: string;
  view_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'TICKET' | 'ALERT' | 'SYSTEM';
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardStats {
  tickets: {
    total: number;
    open: number;
    inProgress: number;
    waitingUser: number;
    resolved: number;
    closed: number;
    criticalOpen: number;
    avgResolutionHours: number;
    avgRating: number;
  };
  assets: {
    total: number;
    available: number;
    assigned: number;
    underMaintenance: number;
    broken: number;
    retired: number;
  };
  monitoring: {
    activeAlerts: number;
    criticalAlerts: number;
    totalMonitored: number;
    offlineDevices: number;
    highDiskDevices: number;
  };
}
