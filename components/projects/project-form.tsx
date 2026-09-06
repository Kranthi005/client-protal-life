import Link from "next/link";
import { ProjectSubmitButton } from "@/components/projects/project-submit-button";
import { PROJECT_STATUSES, type Project } from "@/lib/supabase/types";

type ProjectFormAction = (formData: FormData) => void | Promise<void>;

const statusLabels = {
  PLANNING: "Planning",
  IN_PROGRESS: "In progress",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
} as const;

export function ProjectForm({ action, project, submitLabel, cancelHref }: {
  action: ProjectFormAction;
  project?: Project;
  submitLabel: string;
  cancelHref: string;
}) {
  return (
    <form action={action} className="space-y-6">
      {project && <input type="hidden" name="project_id" value={project.id} />}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Project name
            <input required maxLength={160} name="name" defaultValue={project?.name} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none ring-slate-900 focus:ring-2" />
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Description
            <textarea name="description" defaultValue={project?.description ?? ""} rows={5} maxLength={5_000} className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 outline-none ring-slate-900 focus:ring-2" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Client name
            <input name="client_name" maxLength={160} defaultValue={project?.client_name ?? ""} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none ring-slate-900 focus:ring-2" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Status
            <select name="status" defaultValue={project?.status ?? "PLANNING"} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none ring-slate-900 focus:ring-2">
              {PROJECT_STATUSES.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Progress
            <div className="relative mt-1.5"><input required name="progress" type="number" min="0" max="100" step="1" defaultValue={project?.progress ?? 0} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 outline-none ring-slate-900 focus:ring-2" /><span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">%</span></div>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Start date
            <input name="start_date" type="date" defaultValue={project?.start_date ?? ""} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none ring-slate-900 focus:ring-2" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Due date
            <input name="due_date" type="date" defaultValue={project?.due_date ?? ""} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none ring-slate-900 focus:ring-2" />
          </label>
        </div>
      </section>
      <div className="flex items-center justify-end gap-3">
        <Link href={cancelHref} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">Cancel</Link>
        <ProjectSubmitButton>{submitLabel}</ProjectSubmitButton>
      </div>
    </form>
  );
}
