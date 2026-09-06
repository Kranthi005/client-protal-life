import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, status, progress, due_date")
    .order("created_at", { ascending: false });

  const projectIds = (projects ?? []).map((project) => project.id);

  const { count: taskCount } = projectIds.length
    ? await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .in("project_id", projectIds)
    : { count: 0 };

  const { count: pendingApprovalCount } = projectIds.length
    ? await supabase
        .from("approvals")
        .select("id", { count: "exact", head: true })
        .in("project_id", projectIds)
        .eq("status", "PENDING")
    : { count: 0 };

  const name = profile?.full_name || user.email?.split("@")[0] || "there";

  const activeProjects = (projects ?? []).filter(
    (project) => project.status === "IN_PROGRESS",
  );

  const averageProgress = projects?.length
    ? Math.round(
        projects.reduce((sum, project) => sum + (project.progress ?? 0), 0) /
          projects.length,
      )
    : 0;

  const metrics = [
    {
      label: "Projects",
      value: String(projects?.length ?? 0),
      icon: FolderKanban,
    },
    {
      label: "Active projects",
      value: String(activeProjects.length),
      icon: TrendingUp,
    },
    {
      label: "Tasks",
      value: String(taskCount ?? 0),
      icon: ClipboardList,
    },
    {
      label: "Pending approvals",
      value: String(pendingApprovalCount ?? 0),
      icon: CheckCircle2,
    },
  ];

  return (
    <>
      <div>
        <p className="text-sm font-medium text-slate-500">Dashboard</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
          Welcome back, {name}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Your project workspace at a glance.
        </p>
      </div>

      {!profile && (
        <div className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <p>Your profile is still being set up.</p>
        </div>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-slate-600">{label}</p>
              <Icon className="text-slate-400" size={19} />
            </div>
            <p className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
              {value}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Your projects</h2>
            <p className="mt-1 text-sm text-slate-500">
              Current project progress and delivery status.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {(projects ?? []).length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-slate-500">
                No projects yet.
              </div>
            ) : (
              projects?.map((project) => (
                <a
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block px-5 py-5 transition hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-slate-900">
                        {project.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {project.status === "IN_PROGRESS"
                          ? "In progress"
                          : project.status}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {project.progress ?? 0}%
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-900"
                      style={{ width: `${project.progress ?? 0}%` }}
                    />
                  </div>
                </a>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Portfolio progress
          </p>

          <p className="mt-3 text-5xl font-semibold tracking-tight text-slate-950">
            {averageProgress}%
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Average progress across your projects.
          </p>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-900"
              style={{ width: `${averageProgress}%` }}
            />
          </div>

          <div className="mt-6 rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              NEXUS Intelligence
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Project health, risks, approvals and recommended actions are
              available inside each project.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
