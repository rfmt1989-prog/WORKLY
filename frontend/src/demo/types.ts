export type UserRole = "worker" | "company";
export type CompanyAccessRole = "admin" | "manager" | "hr" | "supervisor";
export type CompanyPermission =
  | "access.manage"
  | "company.manage"
  | "workers.read"
  | "workers.manage"
  | "teams.read"
  | "teams.manage"
  | "projects.read"
  | "projects.manage"
  | "attendance.read"
  | "attendance.manage"
  | "documents.read"
  | "documents.manage"
  | "operations.read";
export type WorkerStatus = "available" | "contracted" | "on_site";
export type ProjectStatus = "planned" | "active" | "paused" | "completed";
export type LanguageCode = "pt" | "en" | "fr" | "es" | "ro" | "de" | "nl";

export type Skill = {
  name: string;
  level: number;
};

export type Certificate = {
  id: string;
  name: string;
  issuer: string;
  issued_at: string;
  expires_at: string;
  status: string;
  file_name: string;
};

export type DemoDocument = {
  id: string;
  owner_type: "worker" | "company" | "project";
  owner_id: string;
  title: string;
  category: string;
  file_name: string;
  status: string;
  updated_at: string;
  demo_content: string;
};

export type BestProject = {
  id: string;
  title: string;
  location: string;
  year: number;
  summary: string;
};

export type Worker = {
  id: string;
  name: string;
  email: string;
  role: "worker";
  avatar: string;
  avatar_color: string;
  age: number;
  country: string;
  flag: string;
  profession: string;
  title: string;
  experience_years: number;
  location: string;
  phone: string;
  bio: string;
  skills: Skill[];
  certificates: Certificate[];
  availability: boolean;
  status: WorkerStatus;
  trust_score: number;
  productivity_score: number;
  rating: number;
  best_projects: BestProject[];
  documents: DemoDocument[];
  languages: string[];
  company_id: string | null;
  current_project_id: string | null;
  schedule: string;
};

export type Company = {
  id: string;
  name: string;
  email: string;
  role: "company";
  avatar: string;
  avatar_color: string;
  industry: string;
  description: string;
  location: string;
  phone: string;
  website: string;
  tax_id: string;
  trust_score: number;
  productivity_score: number;
  documents: DemoDocument[];
};

export type TeamStatus = "available" | "assigned" | "on_site" | "inactive";

export type Team = {
  id: string;
  company_id: string;
  name: string;
  specialty: string;
  description: string;
  status: TeamStatus;
  leader_id: string | null;
  member_ids: string[];
  project_id: string | null;
};

export type Project = {
  id: string;
  company_id: string;
  name: string;
  client: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  geofence_radius_m?: number;
  status: ProjectStatus;
  progress: number;
  start_date: string;
  end_date: string;
  schedule: string;
  team_ids: string[];
  worker_ids: string[];
  documents?: DemoDocument[];
  compliance_requirements?: { documents: string[]; certificates: string[] };
};

export type TimesheetApprovalStatus = "pending" | "approved" | "rejected";

export type Attendance = {
  id: string;
  worker_id: string;
  company_id: string | null;
  project_id: string;
  check_in: string;
  check_out: string | null;
  location_mode: "gps" | "demo";
  latitude: number | null;
  longitude: number | null;
  distance_m?: number | null;
  within_geofence?: boolean | null;
  geofence_radius_m?: number;
  note: string;
  approval_status?: TimesheetApprovalStatus;
  approved_by?: string | null;
  approved_at?: string | null;
  approval_note?: string;
};

export type Contract = {
  id: string;
  worker_id: string;
  company_id: string;
  project_id: string;
  title: string;
  status: "active" | "pending" | "expired";
  start_date: string;
  end_date: string;
  signed_worker: boolean;
  signed_company: boolean;
  file_name: string;
  demo_content: string;
  signature?: string;
};

export type NotificationItem = {
  id: string;
  target_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

export type WorklyState = {
  current_user?: AuthUser;
  version: number;
  generated_at: string;
  workers: Worker[];
  companies: Company[];
  teams: Team[];
  projects: Project[];
  attendance: Attendance[];
  contracts: Contract[];
  notifications: NotificationItem[];
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company_id?: string | null;
  company_role?: CompanyAccessRole;
  permissions?: CompanyPermission[];
  avatar?: string;
  avatar_color?: string;
  title?: string;
  profession?: string;
  industry?: string;
  trust_score?: number;
  productivity_score?: number;
};

export type ToastTone = "success" | "error" | "info";

export type ToastMessage = {
  id: number;
  message: string;
  tone: ToastTone;
};
