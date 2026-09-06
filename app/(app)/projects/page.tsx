import Link from "next/link";
import { AlertCircle, ArrowRight, FolderKanban, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Project, ProjectStatus } from "@/lib/supabase/types";

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
  if (!date) return "No due date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00.000Z`));
}

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("id, full_name, role, created_at, updated_at").eq("id", user.id).maybeSingle<Profile>()
    : { data: null };
  const { data, error } = await supabase
    .from("projects")
    .select("id, organization_id, name, description, client_name, status, progress, start_date, due_date, created_at, updated_at")
    .order("updated_at", { ascending: false });
  const projects = (data ?? []) as Project[];
  const canCreate = profile?.role === "SERVICE_PROVIDER";

  return <>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-sm font-medium text-slate-500">Workspace</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Projects</h1><p className="mt-2 text-sm text-slate-600">Keep every client engagement clear and on track.</p></div>
      {canCreate && <Link href="/projects/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"><Plus size={17} />New project</Link>}
    </div>
    {message && <p role="alert" className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</p>}
    {error ? <section className="mt-8 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800"><AlertCircle className="mt-0.5 shrink-0" size={18} /><p>Projects could not be loaded. Confirm that the Phase 2A Supabase migration has been applied, then refresh this page.</p></section> : projects.length === 0 ? <section className="mt-8 rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"><FolderKanban className="text-slate-500" size={23} /></div><h2 className="mt-4 text-lg font-semibold text-slate-900">{canCreate ? "Your project list is ready" : "No projects assigned yet"}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{canCreate ? "Create your first project to begin sharing a clear view of work with your client." : "Projects assigned to you by your service provider will appear here."}</p>{canCreate && <Link href="/projects/new" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"><Plus size={17} />Create project</Link>}</section> : <section className="mt-8 grid gap-4 lg:grid-cols-2">{projects.map((project) => <Link key={project.id} href={`/projects/${project.id}`} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><h2 className="truncate text-lg font-semibold text-slate-900">{project.name}</h2><p className="mt-1 truncate text-sm text-slate-500">{project.client_name || "No client name"}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[project.status]}`}>{statusLabels[project.status]}</span></div><p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{project.description || "No description has been added."}</p><div className="mt-5"><div className="flex items-center justify-between text-xs font-medium text-slate-500"><span>Progress</span><span>{project.progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-900" style={{ width: `${project.progress}%` }} /></div></div><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm"><span className="text-slate-500">Due {formatDate(project.due_date)}</span><span className="inline-flex items-center gap-1 font-semibold text-slate-900">View <ArrowRight className="transition group-hover:translate-x-0.5" size={16} /></span></div></Link>)}</section>}
  </>;
}
