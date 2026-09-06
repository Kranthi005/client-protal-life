import Link from "next/link";
import { AlertCircle, FolderKanban, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProjectFilters } from "@/components/projects/project-filters";
import type { Profile, Project } from "@/lib/supabase/types";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("id, full_name, role, created_at, updated_at")
        .eq("id", user.id)
        .maybeSingle<Profile>()
    : { data: null };

  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, organization_id, name, description, client_name, status, progress, start_date, due_date, created_at, updated_at",
    )
    .order("updated_at", { ascending: false });

  const projects = (data ?? []) as Project[];
  const canCreate = profile?.role === "SERVICE_PROVIDER";

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-slate-500">Workspace</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Projects
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Keep every client engagement clear and on track.
          </p>
        </div>

        {canCreate && (
          <Link
            href="/projects/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <Plus size={17} />
            New project
          </Link>
        )}
      </div>

      {message && (
        <p
          role="alert"
          className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          {message}
        </p>
      )}

      {error ? (
        <section className="mt-8 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />

          <p>
            Projects could not be loaded. Confirm that the Phase 2A Supabase
            migration has been applied, then refresh this page.
          </p>
        </section>
      ) : projects.length === 0 ? (
        <section className="mt-8 rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <FolderKanban className="text-slate-500" size={23} />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            {canCreate
              ? "Your project list is ready"
              : "No projects assigned yet"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            {canCreate
              ? "Create your first project to begin sharing a clear view of work with your client."
              : "Projects assigned to you by your service provider will appear here."}
          </p>

          {canCreate && (
            <Link
              href="/projects/new"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <Plus size={17} />
              Create project
            </Link>
          )}
        </section>
      ) : (
        <ProjectFilters projects={projects} />
      )}
    </>
  );
}
