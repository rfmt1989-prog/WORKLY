export type WorkerAvailabilityStatus =
  | "available"
  | "busy"
  | "unavailable";

export type WorkerTaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";

export type WorkerTaskPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type WorkerCertificateStatus =
  | "valid"
  | "expiring"
  | "expired";

export type WorkerDocumentStatus =
  | "available"
  | "pending"
  | "rejected"
  | "expired";

export type WorkerAlertSeverity =
  | "info"
  | "success"
  | "warning"
  | "danger";

export type WorkerDashboardStats = {
  jobs_today: number;
  hours_this_week: number;
  documents_pending: number;
  unread_messages: number;
  completed_projects?: number;
  total_hours?: number;
  valid_certificates?: number;
  average_rating?: number;
};

export type WorkerCurrentProject = {
  project_id: number;
  name: string;
  company: string;
  location: string;
  start_time: string;
  end_time: string;
  team_leader: string;
  can_check_in: boolean;
  role?: string;
  progress?: number;
  next_task?: string | null;
  start_date?: string | null;
  expected_end_date?: string | null;
  image_url?: string | null;
};

export type WorkerProfile = {
  worker_id: number;
  name: string;
  role: string;
  pulse: number;
  status: string;
  availability_status?: WorkerAvailabilityStatus;
  location?: string | null;
  nationality?: string | null;
  years_of_experience?: number;
  average_rating?: number;
  review_count?: number;
  overall_rating?: number;
  profile_completion?: number;
  avatar_url?: string | null;
  cover_image_url?: string | null;
};

export type WorkerTask = {
  id: number;
  title: string;
  description?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  status: WorkerTaskStatus;
  priority: WorkerTaskPriority;
  project_id?: number | null;
  project_name?: string | null;
};

export type WorkerTimeTracking = {
  is_shift_active: boolean;
  check_in_time?: string | null;
  check_out_time?: string | null;
  elapsed_seconds?: number;
  hours_today: number;
  hours_this_week: number;
  overtime_hours: number;
};

export type WorkerWeeklyHours = {
  day: string;
  hours: number;
};

export type WorkerSkill = {
  id: number;
  name: string;
  value: number;
  category?: string | null;
};

export type WorkerCertificate = {
  id: number;
  name: string;
  issuer?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  status: WorkerCertificateStatus;
  document_url?: string | null;
};

export type WorkerRecentProject = {
  id: number;
  name: string;
  company: string;
  location?: string | null;
  role?: string | null;
  progress?: number;
  status?: string | null;
  image_url?: string | null;
};

export type WorkerDocument = {
  id: number;
  name: string;
  type?: string | null;
  status: WorkerDocumentStatus;
  updated_at?: string | null;
  download_url?: string | null;
};

export type WorkerAlert = {
  id: number;
  title: string;
  description?: string | null;
  severity: WorkerAlertSeverity;
  created_at?: string | null;
  action_label?: string | null;
  action_route?: string | null;
};

export type WorkerDashboardData = WorkerProfile & {
  stats: WorkerDashboardStats;
  current_project: WorkerCurrentProject | null;
  tasks?: WorkerTask[];
  time_tracking?: WorkerTimeTracking | null;
  weekly_hours?: WorkerWeeklyHours[];
  skills?: WorkerSkill[];
  certificates?: WorkerCertificate[];
  recent_projects?: WorkerRecentProject[];
  documents?: WorkerDocument[];
  alerts?: WorkerAlert[];
};