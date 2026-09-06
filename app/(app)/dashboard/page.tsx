import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FolderKanban,
  Plus,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
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

  const { count: completedTaskCount } = projectIds.length
    ? await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .in("project_id", projectIds)
        .in("status", ["DONE", "COMPLETED"])
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

  const completedProjects = (projects ?? []).filter(
    (project) => project.status === "COMPLETED" || project.status === "DONE",
  );

  const overdueProjects = (projects ?? []).filter((project) => {
    if (!project.due_date) return false;
    if (project.status === "COMPLETED" || project.status === "DONE") {
      return false;
    }

    return new Date(project.due_date) < new Date();
  });

  const upcomingProjects = (projects ?? [])
    .filter((project) => {
      if (!project.due_date) return false;
      if (project.status === "COMPLETED" || project.status === "DONE") {
        return false;
      }

      return new Date(project.due_date) >= new Date();
    })
    .sort(
      (a, b) =>
        new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime(),
    )
    .slice(0, 4);

  const averageProgress = projects?.length
    ? Math.round(
        projects.reduce((sum, project) => sum + (project.progress ?? 0), 0) /
          projects.length,
      )
    : 0;

  const completionRate = taskCount
    ? Math.round(((completedTaskCount ?? 0) / taskCount) * 100)
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Dashboard</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Welcome back, {name}
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Your project workspace at a glance.
          </p>
        </div>

        <Link
          href="/projects"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          <Plus size={16} />
          New project
        </Link>
      </div>

      {!profile && (
        <div className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <p>Your profile is still being set up.</p>
        </div>
      )}

      {/* Main metrics */}
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

      {/* Portfolio overview */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Portfolio overview</h2>

            <p className="mt-1 text-sm text-slate-500">
              A quick health check across your projects.
            </p>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Completion
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {completionRate}%
              </p>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-slate-900"
                  style={{
                    width: `${completionRate}%`,
                  }}
                />
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Completed
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {completedProjects.length}
              </p>

              <p className="mt-1 text-xs text-slate-500">finished projects</p>
            </div>

            <div
              className={`rounded-lg p-4 ${
                overdueProjects.length ? "bg-red-50" : "bg-emerald-50"
              }`}
            >
              <p
                className={`text-xs font-medium uppercase tracking-wide ${
                  overdueProjects.length ? "text-red-600" : "text-emerald-600"
                }`}
              >
                Deadlines
              </p>

              <p
                className={`mt-2 text-2xl font-semibold ${
                  overdueProjects.length ? "text-red-900" : "text-emerald-900"
                }`}
              >
                {overdueProjects.length}
              </p>

              <p
                className={`mt-1 text-xs ${
                  overdueProjects.length ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {overdueProjects.length
                  ? "overdue projects"
                  : "no overdue projects"}
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
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
              style={{
                width: `${averageProgress}%`,
              }}
            />
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
            <span>{completedTaskCount ?? 0} completed tasks</span>
            <span>{taskCount ?? 0} total tasks</span>
          </div>
        </div>
      </section>

      {/* Projects + deadlines */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">Your projects</h2>

              <p className="mt-1 text-sm text-slate-500">
                Current project progress and delivery status.
              </p>
            </div>

            <Link
              href="/projects"
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-950"
            >
              View all
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {(projects ?? []).length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-slate-500">
                No projects yet.
              </div>
            ) : (
              projects?.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block px-5 py-5 transition hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate font-medium text-slate-900">
                        {project.name}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {project.status === "IN_PROGRESS"
                          ? "In progress"
                          : project.status}
                      </p>
                    </div>

                    <span className="shrink-0 text-sm font-semibold text-slate-700">
                      {project.progress ?? 0}%
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-900"
                      style={{
                        width: `${project.progress ?? 0}%`,
                      }}
                    />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Upcoming deadlines */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Upcoming deadlines</h2>

            <p className="mt-1 text-sm text-slate-500">
              Projects that need attention next.
            </p>
          </div>

          {upcomingProjects.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <CalendarDays size={26} className="mx-auto text-slate-400" />

              <p className="mt-3 text-sm text-slate-500">
                No upcoming deadlines.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Clock3 size={17} className="text-slate-500" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {project.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Due{" "}
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                      }).format(new Date(project.due_date!))}
                    </p>
                  </div>

                  <ArrowRight size={15} className="shrink-0 text-slate-400" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quick actions */}
      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Quick actions
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link
            href="/projects"
            className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">
                Manage projects
              </p>
              <p className="mt-1 text-xs text-slate-500">
                View and organize projects
              </p>
            </div>

            <ArrowRight size={16} />
          </Link>

          <Link
            href="/tasks"
            className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">Review tasks</p>
              <p className="mt-1 text-xs text-slate-500">Track execution</p>
            </div>

            <ArrowRight size={16} />
          </Link>

          <Link
            href="/activity"
            className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">
                View activity
              </p>
              <p className="mt-1 text-xs text-slate-500">
                See recent project events
              </p>
            </div>

            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Intelligence */}
      <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          NEXUS Intelligence
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Project health, risks, approvals and recommended actions are available
          inside each project.
        </p>
      </section>
    </>
  );
}
