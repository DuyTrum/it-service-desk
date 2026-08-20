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

export interface AuthUserPayload {
  id: string;
  email: string;
  fullName: string;
  role: RoleName;
  roleId: number;
  departmentId?: string;
}

export interface UserEntity {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  job_title?: string;
  role_id: number;
  role_name: RoleName;
  department_id?: string;
  department_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface AssetEntity {
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
  department_id?: string;
  department_name?: string;
  location?: string;
  ip_address?: string;
  mac_address?: string;
  specs?: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketEntity {
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
  assigned_tech_id?: string;
  tech_name?: string;
  asset_id?: string;
  asset_code?: string;
  asset_name?: string;
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
}

export interface DeviceHealthPayload {
  hostname: string;
  os_info?: string;
  cpu_usage: number;
  ram_usage: number;
  disk_usage: number;
  ip_address?: string;
  mac_address?: string;
  network_status?: string;
  uptime_seconds?: number;
}
