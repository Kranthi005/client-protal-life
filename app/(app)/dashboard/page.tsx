import { AlertCircle, CheckCircle2, ClipboardList, FolderKanban } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("id, full_name, role, created_at, updated_at").eq("id", user.id).maybeSingle<Profile>() : { data: null };
  const { count: projectCount, error: projectCountError } = user
    ? await supabase.from("projects").select("id", { count: "exact", head: true })
    : { count: 0, error: null };
  const name = profile?.full_name || user?.email?.split("@")[0] || "there";
  const role = profile?.role === "CLIENT" ? "Client" : "Service provider";
  const metrics = [
    { label: "Projects", value: projectCountError ? "—" : String(projectCount ?? 0), icon: FolderKanban },
    { label: "Tasks", value: "0", icon: ClipboardList },
    { label: "Pending approvals", value: "0", icon: CheckCircle2 },
  ];

  return <>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-slate-500">Dashboard</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Welcome back, {name}</h1><p className="mt-2 text-sm text-slate-600">You&apos;re signed in as a <span className="font-medium text-slate-800">{role}</span>.</p></div></div>
    {!profile && <div className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><AlertCircle className="mt-0.5 shrink-0" size={18} /><p>Your profile is still being set up. Run the included Supabase migration before inviting new users.</p></div>}
    {projectCountError && <div className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><AlertCircle className="mt-0.5 shrink-0" size={18} /><p>Projects could not be loaded. Apply the Phase 2A migration, then refresh this page.</p></div>}
    <section className="mt-8 grid gap-4 sm:grid-cols-3">{metrics.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-600">{label}</p><Icon className="text-slate-400" size={19} /></div><p className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">{value}</p></article>)}</section>
    <section className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Recent activity</h2><p className="mt-1 text-sm text-slate-500">Updates from projects and collaborators will appear here.</p></div><div className="flex flex-col items-center px-5 py-14 text-center"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100"><ClipboardList className="text-slate-500" size={21} /></div><h3 className="mt-4 text-sm font-semibold text-slate-800">No activity yet</h3><p className="mt-1 max-w-sm text-sm text-slate-500">Once projects are underway, this will be your shared timeline.</p></div></section>
  </>;
}
