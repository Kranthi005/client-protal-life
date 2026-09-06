export type Feedback = {
  id: string;
  project_id: string;
  deliverable_id: string | null;
  author_id: string;
  message: string;
  created_at: string;
};

export type ApprovalStatus = "PENDING" | "APPROVED" | "CHANGES_REQUESTED";

export type Approval = {
  id: string;
  project_id: string;
  deliverable_id: string;
  requested_by: string;
  reviewed_by: string | null;
  status: ApprovalStatus;
  comment: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export type UserRole = "SERVICE_PROVIDER" | "CLIENT";

export const PROJECT_STATUSES = [
  "PLANNING",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "DONE",
  "BLOCKED",
] as const;

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export const MILESTONE_STATUSES = [
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
] as const;

export const DELIVERABLE_STATUSES = ["DRAFT", "IN_REVIEW", "APPROVED"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export type DeliverableStatus = (typeof DELIVERABLE_STATUSES)[number];

export type Profile = {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type Organization = {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  client_name: string | null;
  status: ProjectStatus;
  progress: number;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectMember = {
  project_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Milestone = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectFile = {
  id: string;
  project_id: string;
  name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string;
  created_at: string;
};

export type Deliverable = {
  id: string;
  project_id: string;
  file_id: string | null;
  title: string;
  description: string | null;
  status: DeliverableStatus;
  created_at: string;
  updated_at: string;
};
