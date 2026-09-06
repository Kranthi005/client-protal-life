import Link from "next/link";
import { ArrowLeft, CalendarDays, Pencil, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { ProjectWorkItems } from "@/components/projects/project-work-items";
import { createClient } from "@/lib/supabase/server";
import type {
  Milestone,
  Profile,
  Project,
  ProjectStatus,
  Task,
} from "@/lib/supabase/types";

const statusLabels: Record<ProjectStatus, string> = {
  PLANNING: "Planning",
  IN_PROGRESS: "In progress",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
};

const statusClasses: Record<ProjectStatus, string> = {
  PLANNING: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  ON_HOLD: "bg-amber-50 text-amber-800",
  COMPLETED: "bg-emerald-50 text-emerald-800",
};

function formatDate(date: string | null) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00.000Z`));
}

export default async function ProjectDetailPage({ params, searchParams }: { params: Promise<{ projectId: string }>; searchParams: Promise<{ message?: string }> }) {
  const [{ projectId }, { message }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, organization_id, name, description, client_name, status, progress, start_date, due_date, created_at, updated_at")
    .eq("id", projectId)
    .maybeSingle<Project>();
  if (error || !data) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("id, full_name, role, created_at, updated_at").eq("id", user.id).maybeSingle<Profile>()
    : { data: null };
  const project = data;
  const canEdit = profile?.role === "SERVICE_PROVIDER";
  const [tasksResult, milestonesResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, project_id, title, description, status, priority, due_date, created_at, updated_at")
      .eq("project_id", project.id)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("milestones")
      .select("id, project_id, title, description, status, due_date, created_at, updated_at")
      .eq("project_id", project.id)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
  ]);
  const tasks = (tasksResult.data ?? []) as Task[];
  const milestones = (milestonesResult.data ?? []) as Milestone[];

  return <>
    <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"><ArrowLeft size={16} />All projects</Link>
    <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight text-slate-950">{project.name}</h1><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[project.status]}`}>{statusLabels[project.status]}</span></div><p className="mt-2 text-sm text-slate-600">{project.client_name || "No client name has been added."}</p></div>{canEdit && <Link href={`/projects/${project.id}/edit`} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"><Pencil size={16} />Edit project</Link>}</div>
    {message && <p role="alert" className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</p>}
    <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]"><div className="space-y-6"><article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-base font-semibold text-slate-900">Overview</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{project.description || "No description has been added for this project."}</p></article><article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><h2 className="text-base font-semibold text-slate-900">Progress</h2><span className="text-2xl font-semibold tracking-tight text-slate-950">{project.progress}%</span></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Project progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={project.progress}><div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${project.progress}%` }} /></div></article></div><aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-base font-semibold text-slate-900">Project details</h2><dl className="mt-5 space-y-5"><div className="flex gap-3"><UserRound className="mt-0.5 shrink-0 text-slate-400" size={18} /><div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Client</dt><dd className="mt-1 text-sm font-medium text-slate-800">{project.client_name || "Not set"}</dd></div></div><div className="flex gap-3"><CalendarDays className="mt-0.5 shrink-0 text-slate-400" size={18} /><div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Start date</dt><dd className="mt-1 text-sm font-medium text-slate-800">{formatDate(project.start_date)}</dd></div></div><div className="flex gap-3"><CalendarDays className="mt-0.5 shrink-0 text-slate-400" size={18} /><div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Due date</dt><dd className="mt-1 text-sm font-medium text-slate-800">{formatDate(project.due_date)}</dd></div></div></dl></aside></section>
    <ProjectWorkItems projectId={project.id} tasks={tasks} milestones={milestones} canManage={canEdit} tasksError={Boolean(tasksResult.error)} milestonesError={Boolean(milestonesResult.error)} />
  </>;
}
