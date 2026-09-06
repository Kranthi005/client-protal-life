import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  FileText,
  FolderKanban,
  ListChecks,
  Settings,
  User,
} from "lucide-react";

type Props = {
  params: Promise<{ section: string }>;
};

type WorkspaceProject = {
  id: string;
  name: string;
  status: string | null;
  progress: number | null;
  due_date: string | null;
};

type WorkspaceTask = {
  id: string;
  project_id: string;
  title: string;
  status: string | null;
  priority: string | null;
  due_date: string | null;
};

type WorkspaceFile = {
  id: string;
  project_id: string;
  file_name?: string | null;
  name?: string | null;
  title?: string | null;
  created_at: string;
};

type WorkspaceDeliverable = {
  id: string;
  project_id: string;
  title: string;
  status: string | null;
  created_at: string;
};

type WorkspaceActivity = {
  id: string;
  project_id: string;
  actor_id: string | null;
  type: string;
  title: string;
  description: string | null;
  created_at: string;
};

type WorkspaceProfile = {
  id: string;
  full_name: string | null;
  role: string | null;
};

type WorkspaceUser = {
  id: string;
  email?: string | null;
};

type WorkspaceData = {
  user: WorkspaceUser;
  profile: WorkspaceProfile | null;
  projects: WorkspaceProject[];
  tasks: WorkspaceTask[];
  files: WorkspaceFile[];
  deliverables: WorkspaceDeliverable[];
  activities: WorkspaceActivity[];
};

function formatDate(value: string | null) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function statusLabel(value: string | null | undefined) {
  if (!value) return "Unknown";

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusClass(value: string | null | undefined) {
  const status = value?.toUpperCase();

  if (
    status === "DONE" ||
    status === "COMPLETED" ||
    status === "APPROVED"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    status === "IN_PROGRESS" ||
    status === "IN PROGRESS" ||
    status === "IN_REVIEW" ||
    status === "IN REVIEW"
  ) {
    return "bg-blue-50 text-blue-700";
  }

  if (
    status === "BLOCKED" ||
    status === "CHANGES_REQUESTED"
  ) {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}

async function getWorkspaceData(): Promise<WorkspaceData | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [
    profileResult,
    projectsResult,
    tasksResult,
    filesResult,
    deliverablesResult,
    activitiesResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("projects")
      .select("id, name, status, progress, due_date")
      .order("created_at", { ascending: false }),

    supabase
      .from("tasks")
      .select("id, project_id, title, status, priority, due_date")
      .order("due_date", {
        ascending: true,
        nullsFirst: false,
      }),

    supabase
      .from("project_files")
      .select("*")
      .order("created_at", { ascending: false }),

    supabase
      .from("deliverables")
      .select("id, project_id, title, status, created_at")
      .order("created_at", { ascending: false }),

    supabase
      .from("activities")
      .select(
        "id, project_id, actor_id, type, title, description, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    profile: profileResult.data as WorkspaceProfile | null,
    projects: (projectsResult.data ?? []) as WorkspaceProject[],
    tasks: (tasksResult.data ?? []) as WorkspaceTask[],
    files: (filesResult.data ?? []) as WorkspaceFile[],
    deliverables:
      (deliverablesResult.data ??
        []) as WorkspaceDeliverable[],
    activities:
      (activitiesResult.data ??
        []) as WorkspaceActivity[],
  };
}

function WorkspaceHeader({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
          {icon}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {eyebrow}
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

function TasksWorkspace({
  tasks,
  projects,
}: {
  tasks: WorkspaceTask[];
  projects: WorkspaceProject[];
}) {
  const projectMap = new Map(
    projects.map((project) => [project.id, project.name]),
  );

  const completed = tasks.filter(
    (task) =>
      task.status === "DONE" ||
      task.status === "COMPLETED",
  ).length;

  const inProgress = tasks.filter(
    (task) =>
      task.status === "IN_PROGRESS" ||
      task.status === "IN PROGRESS",
  ).length;

  const open = tasks.length - completed;

  return (
    <>
      <WorkspaceHeader
        eyebrow="Workspace"
        title="Tasks"
        description="Track execution across every active client project."
        icon={<ListChecks size={20} />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Total tasks
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {tasks.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            In progress
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {inProgress}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Open
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {open}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            All project tasks
          </h2>
        </div>

        {tasks.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <ListChecks
              size={28}
              className="mx-auto text-slate-400"
            />
            <p className="mt-3 text-sm text-slate-500">
              No tasks have been created yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {task.title}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {projectMap.get(task.project_id) ??
                      "Project"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {task.priority && (
                    <span className="text-xs font-medium text-slate-500">
                      {statusLabel(task.priority)}
                    </span>
                  )}

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                      task.status,
                    )}`}
                  >
                    {statusLabel(task.status)}
                  </span>

                  {task.due_date && (
                    <span className="hidden items-center gap-1 text-xs text-slate-500 sm:flex">
                      <CalendarDays size={13} />
                      {formatDate(task.due_date)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function FilesWorkspace({
  files,
  deliverables,
  projects,
}: {
  files: WorkspaceFile[];
  deliverables: WorkspaceDeliverable[];
  projects: WorkspaceProject[];
}) {
  const projectMap = new Map(
    projects.map((project) => [project.id, project.name]),
  );

  return (
    <>
      <WorkspaceHeader
        eyebrow="Workspace"
        title="Files"
        description="A centralized view of shared project files and deliverables."
        icon={<FileText size={20} />}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Shared files
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {files.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Deliverables
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {deliverables.length}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Project files & deliverables
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {files.map((file) => {
            const fileName =
              file.file_name ??
              file.name ??
              file.title ??
              "Project file";

            return (
              <div
                key={file.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <FileText
                      size={17}
                      className="text-slate-500"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {fileName}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {projectMap.get(file.project_id) ??
                        "Project"}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 text-xs text-slate-400">
                  {formatDate(file.created_at)}
                </span>
              </div>
            );
          })}

          {deliverables.map((deliverable) => (
            <div
              key={`deliverable-${deliverable.id}`}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <CheckCircle2
                    size={17}
                    className="text-slate-500"
                  />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {deliverable.title}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {projectMap.get(
                      deliverable.project_id,
                    ) ?? "Project"}
                  </p>
                </div>
              </div>

              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                  deliverable.status,
                )}`}
              >
                {statusLabel(deliverable.status)}
              </span>
            </div>
          ))}

          {files.length === 0 && deliverables.length === 0 && (
            <div className="px-5 py-12 text-center">
              <FileText
                size={28}
                className="mx-auto text-slate-400"
              />
              <p className="mt-3 text-sm text-slate-500">
                No files or deliverables have been shared yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ActivityWorkspace({
  activities,
  projects,
}: {
  activities: WorkspaceActivity[];
  projects: WorkspaceProject[];
}) {
  const projectMap = new Map(
    projects.map((project) => [project.id, project.name]),
  );

  return (
    <>
      <WorkspaceHeader
        eyebrow="Workspace"
        title="Activity"
        description="See the latest project events, decisions, feedback, and delivery changes."
        icon={<Activity size={20} />}
      />

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Recent activity
          </h2>
        </div>

        {activities.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Activity
              size={28}
              className="mx-auto text-slate-400"
            />
            <p className="mt-3 text-sm text-slate-500">
              Project activity will appear here as work
              progresses.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 px-5 py-5"
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <Activity
                    size={16}
                    className="text-slate-500"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-slate-900">
                      {item.title}
                    </p>

                    <span className="shrink-0 text-xs text-slate-400">
                      {formatDate(item.created_at)}
                    </span>
                  </div>

                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {projectMap.get(item.project_id) ??
                      "Project"}{" "}
                    · {statusLabel(item.type)}
                  </p>

                  {item.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function SettingsWorkspace({
  profile,
  user,
  projects,
}: {
  profile: WorkspaceProfile | null;
  user: WorkspaceUser;
  projects: WorkspaceProject[];
}) {
  return (
    <>
      <WorkspaceHeader
        eyebrow="Workspace"
        title="Settings"
        description="Manage your NEXUS account and workspace information."
        icon={<Settings size={20} />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
              <User size={18} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Account
              </h2>
              <p className="text-xs text-slate-500">
                Your NEXUS account information
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Name
              </p>
              <p className="mt-1 text-sm text-slate-900">
                {profile?.full_name || "NEXUS User"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Email
              </p>
              <p className="mt-1 text-sm text-slate-900">
                {user.email || "No email available"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Role
              </p>
              <p className="mt-1 text-sm text-slate-900">
                {statusLabel(
                  profile?.role ?? "SERVICE_PROVIDER",
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
              <FolderKanban
                size={18}
                className="text-slate-600"
              />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Workspace overview
              </h2>
              <p className="text-xs text-slate-500">
                Current project access
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-3xl font-bold text-slate-900">
              {projects.length}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              accessible project
              {projects.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="mt-6 rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">
              NEXUS workspace
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Centralized project communication, files,
              tasks, approvals, feedback, activity, and
              project intelligence.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default async function WorkspaceSectionPage({
  params,
}: Props) {
  const { section } = await params;
  const data = await getWorkspaceData();

  if (!data) {
    return null;
  }

  if (section === "tasks") {
    return (
      <TasksWorkspace
        tasks={data.tasks}
        projects={data.projects}
      />
    );
  }

  if (section === "files") {
    return (
      <FilesWorkspace
        files={data.files}
        deliverables={data.deliverables}
        projects={data.projects}
      />
    );
  }

  if (section === "activity") {
    return (
      <ActivityWorkspace
        activities={data.activities}
        projects={data.projects}
      />
    );
  }

  if (section === "settings") {
    return (
      <SettingsWorkspace
        profile={data.profile}
        user={data.user}
        projects={data.projects}
      />
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">
        Workspace
      </h1>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        Select a workspace section from the navigation.
      </p>

      <Link
        href="/projects"
        className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        View projects
      </Link>
    </section>
  );
}