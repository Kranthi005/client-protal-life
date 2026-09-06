import { notFound, redirect } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";
import { updateProject } from "@/app/(app)/projects/actions";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Project } from "@/lib/supabase/types";

export default async function EditProjectPage({ params, searchParams }: { params: Promise<{ projectId: string }>; searchParams: Promise<{ message?: string }> }) {
  const [{ projectId }, { message }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("id, full_name, role, created_at, updated_at").eq("id", user.id).maybeSingle<Profile>();
  if (profile?.role !== "SERVICE_PROVIDER") redirect(`/projects/${projectId}`);

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, organization_id, name, description, client_name, status, progress, start_date, due_date, created_at, updated_at")
    .eq("id", projectId)
    .maybeSingle<Project>();
  if (error || !project) notFound();

  return <><div><p className="text-sm font-medium text-slate-500">Projects</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Edit project</h1><p className="mt-2 text-sm text-slate-600">Update the details that keep collaborators aligned.</p></div>{message && <p role="alert" className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</p>}<div className="mt-8"><ProjectForm action={updateProject} project={project} submitLabel="Save changes" cancelHref={`/projects/${project.id}`} /></div></>;
}
