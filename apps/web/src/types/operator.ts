// Типове за операторския модул

export type SignalStatus = "novo" | "potvurden" | "v_proces" | "popraven" | "arhiv" | "otkhvurlen";
export type WorkOrderStatus = "open" | "assigned" | "in_progress" | "done" | "verified" | "rework";
export type Priority = "low" | "normal" | "high" | "urgent";
export type SLAStatus = "ok" | "warning" | "overdue";

export interface Signal {
  id: string;
  title: string;
  description: string;
  status: SignalStatus;
  category_id: string;
  category_name?: string;
  priority: Priority;
  address: string;
  coordinates: { lat: number; lng: number };
  reporter: {
    id?: string;
    name?: string;
    contact_masked?: string;
  };
  owner_user_id?: string;
  owner_name?: string;
  department_id?: string;
  department_name?: string;
  has_complaint: boolean;
  complaint_id?: string;
  has_duplicates: boolean;
  master_id?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  in_process_at?: string;
  resolved_at?: string;
  archived_at?: string;
  rejected_at?: string;
  media_count: number;
  comments_count: number;
  views_count: number;
  sla: {
    tta_deadline?: string;
    process_deadline?: string;
    ttr_deadline?: string;
    tta_status: SLAStatus;
    process_status?: SLAStatus;
  };
  _etag?: string;
}

export interface WorkOrder {
  id: string;
  signal_id: string;
  department_id?: string;
  contractor_id?: string;
  priority: Priority;
  due_at: string;
  status: WorkOrderStatus;
  created_at: string;
  updated_at: string;
  notes?: string;
  assigned_to?: string;
}

export interface Note {
  id: string;
  signal_id: string;
  type: "public" | "internal";
  author_id: string;
  author_name?: string;
  body: string;
  files: Array<{
    id: string;
    url: string;
    name: string;
    size: number;
  }>;
  created_at: string;
}

export interface DuplicateLink {
  master_id: string;
  child_id: string;
  reason: string;
  linked_at: string;
  linked_by: string;
  score?: number;
}

export interface Escalation {
  id: string;
  signal_id: string;
  to: "ombudsman";
  reason: string;
  created_by: string;
  created_at: string;
  status: "open" | "acknowledged" | "resolved";
  notes?: string;
}

export interface KPIData {
  new_today: number;
  new_7days: number;
  new_30days: number;
  confirmed_within_48h: number;
  confirmed_within_48h_pct: number;
  tta_overdue: number;
  tta_overdue_trend: number;
  in_process: number;
  resolved_period: number;
  ttr_median_days: number;
}

export interface DashboardData {
  kpi: KPIData;
  inflow_vs_processed: Array<{
    date: string;
    new: number;
    processed: number;
  }>;
  top_categories: Array<{
    id: string;
    name: string;
    count: number;
    pct: number;
    change: number;
  }>;
  top_areas: Array<{
    id: string;
    name: string;
    count: number;
  }>;
  recent_escalations: Array<{
    id: string;
    signal_id: string;
    signal_title: string;
    created_at: string;
  }>;
}

export interface SignalFilters {
  status?: SignalStatus[];
  category?: string[];
  area?: string[];
  priority?: Priority[];
  owner?: string;
  department?: string;
  has_complaint?: boolean;
  has_duplicate?: boolean;
  created_from?: string;
  created_to?: string;
  q?: string;
  sort?: string;
  cursor?: string;
  limit?: number;
}

export interface SignalsListResponse {
  items: Signal[];
  next_cursor?: string;
  total?: number;
}
