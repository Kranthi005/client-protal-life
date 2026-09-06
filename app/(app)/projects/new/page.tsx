import { redirect } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";
import { createProject } from "@/app/(app)/projects/actions";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("id, full_name, role, created_at, updated_at").eq("id", user.id).maybeSingle<Profile>();

  if (profile?.role !== "SERVICE_PROVIDER") {
    return <section className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm"><h1 className="text-xl font-semibold text-slate-900">Projects are managed by your service provider</h1><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">You can view projects that are assigned to you, but only service providers can create them.</p></section>;
  }

  return <><div><p className="text-sm font-medium text-slate-500">Projects</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Create project</h1><p className="mt-2 text-sm text-slate-600">Start with the information your team and client need to align.</p></div>{message && <p role="alert" className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</p>}<div className="mt-8"><ProjectForm action={createProject} submitLabel="Create project" cancelHref="/projects" /></div></>;
}
