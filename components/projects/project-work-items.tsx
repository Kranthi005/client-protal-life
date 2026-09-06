import { CalendarDays, CheckSquare, Flag, Plus, Trash2 } from "lucide-react";
import {
  createMilestone,
  createTask,
  deleteMilestone,
  deleteTask,
  updateMilestoneStatus,
  updateTaskStatus,
} from "@/app/(app)/projects/work-items-actions";
import { ProjectSubmitButton } from "@/components/projects/project-submit-button";
import {
  MILESTONE_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Milestone,
  type MilestoneStatus,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/supabase/types";

const taskStatusLabels: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  BLOCKED: "Blocked",
};

const taskStatusClasses: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  DONE: "bg-emerald-50 text-emerald-800",
  BLOCKED: "bg-rose-50 text-rose-800",
};

const priorityLabels: Record<TaskPriority, string> = {
  LOW: "Low priority",
  MEDIUM: "Medium priority",
  HIGH: "High priority",
};

const priorityClasses: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-50 text-amber-800",
  HIGH: "bg-rose-50 text-rose-800",
};

const milestoneStatusLabels: Record<MilestoneStatus, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

const milestoneStatusClasses: Record<MilestoneStatus, string> = {
  PLANNED: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-800",
};

function formatDate(date: string | null) {
  if (!date) return "No due date";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

function SectionError({ name }: { name: string }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      {name} could not be loaded. Confirm that the Tasks and Milestones migration has been applied, then refresh this page.
    </div>
  );
}

function TaskCreateForm({ projectId }: { projectId: string }) {
  return (
    <details className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-slate-800">
        <Plus size={16} /> Add task
      </summary>
      <form action={createTask} className="mt-4 grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="project_id" value={projectId} />
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Task title
          <input required name="title" maxLength={160} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none ring-slate-900 focus:ring-2" />
        </label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Description <span className="font-normal text-slate-500">(optional)</span>
          <textarea name="description" maxLength={5_000} rows={3} className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none ring-slate-900 focus:ring-2" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Priority
          <select name="priority" defaultValue="MEDIUM" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none ring-slate-900 focus:ring-2">
            {TASK_PRIORITIES.map((priority) => <option key={priority} value={priority}>{priorityLabels[priority]}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Due date <span className="font-normal text-slate-500">(optional)</span>
          <input name="due_date" type="date" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none ring-slate-900 focus:ring-2" />
        </label>
        <div className="flex justify-end sm:col-span-2"><ProjectSubmitButton>Add task</ProjectSubmitButton></div>
      </form>
    </details>
  );
}

function MilestoneCreateForm({ projectId }: { projectId: string }) {
  return (
    <details className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-slate-800">
        <Plus size={16} /> Add milestone
      </summary>
      <form action={createMilestone} className="mt-4 grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="project_id" value={projectId} />
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Milestone title
          <input required name="title" maxLength={160} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none ring-slate-900 focus:ring-2" />
        </label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Description <span className="font-normal text-slate-500">(optional)</span>
          <textarea name="description" maxLength={5_000} rows={3} className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none ring-slate-900 focus:ring-2" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Due date <span className="font-normal text-slate-500">(optional)</span>
          <input name="due_date" type="date" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none ring-slate-900 focus:ring-2" />
        </label>
        <div className="flex items-end justify-end sm:col-span-2"><ProjectSubmitButton>Add milestone</ProjectSubmitButton></div>
      </form>
    </details>
  );
}

function TaskRow({ task, projectId, canManage }: { task: Task; projectId: string; canManage: boolean }) {
  return (
    <li className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900">{task.title}</h3>
          {task.description && <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-slate-600">{task.description}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className={`rounded-full px-2.5 py-1 ${taskStatusClasses[task.status]}`}>{taskStatusLabels[task.status]}</span>
            <span className={`rounded-full px-2.5 py-1 ${priorityClasses[task.priority]}`}>{priorityLabels[task.priority]}</span>
            <span className="inline-flex items-center gap-1 text-slate-500"><CalendarDays size={14} />{formatDate(task.due_date)}</span>
          </div>
        </div>
        {canManage && <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <form action={updateTaskStatus} className="flex items-center gap-2">
            <input type="hidden" name="project_id" value={projectId} />
            <input type="hidden" name="task_id" value={task.id} />
            <select name="status" defaultValue={task.status} aria-label={`Status for ${task.title}`} className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-medium text-slate-700 outline-none ring-slate-900 focus:ring-2">
              {TASK_STATUSES.map((status) => <option key={status} value={status}>{taskStatusLabels[status]}</option>)}
            </select>
            <button type="submit" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Save</button>
          </form>
          <form action={deleteTask}>
            <input type="hidden" name="project_id" value={projectId} />
            <input type="hidden" name="task_id" value={task.id} />
            <button type="submit" aria-label={`Delete ${task.title}`} className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"><Trash2 size={17} /></button>
          </form>
        </div>}
      </div>
    </li>
  );
}

function MilestoneRow({ milestone, projectId, canManage }: { milestone: Milestone; projectId: string; canManage: boolean }) {
  return (
    <li className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900">{milestone.title}</h3>
          {milestone.description && <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-slate-600">{milestone.description}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className={`rounded-full px-2.5 py-1 ${milestoneStatusClasses[milestone.status]}`}>{milestoneStatusLabels[milestone.status]}</span>
            <span className="inline-flex items-center gap-1 text-slate-500"><CalendarDays size={14} />{formatDate(milestone.due_date)}</span>
          </div>
        </div>
        {canManage && <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <form action={updateMilestoneStatus} className="flex items-center gap-2">
            <input type="hidden" name="project_id" value={projectId} />
            <input type="hidden" name="milestone_id" value={milestone.id} />
            <select name="status" defaultValue={milestone.status} aria-label={`Status for ${milestone.title}`} className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-medium text-slate-700 outline-none ring-slate-900 focus:ring-2">
              {MILESTONE_STATUSES.map((status) => <option key={status} value={status}>{milestoneStatusLabels[status]}</option>)}
            </select>
            <button type="submit" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Save</button>
          </form>
          <form action={deleteMilestone}>
            <input type="hidden" name="project_id" value={projectId} />
            <input type="hidden" name="milestone_id" value={milestone.id} />
            <button type="submit" aria-label={`Delete ${milestone.title}`} className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"><Trash2 size={17} /></button>
          </form>
        </div>}
      </div>
    </li>
  );
}

export function ProjectWorkItems({
  projectId,
  tasks,
  milestones,
  canManage,
  tasksError,
  milestonesError,
}: {
  projectId: string;
  tasks: Task[];
  milestones: Milestone[];
  canManage: boolean;
  tasksError: boolean;
  milestonesError: boolean;
}) {
  return (
    <section className="mt-6 grid gap-6 xl:grid-cols-2">
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2"><CheckSquare className="text-slate-500" size={18} /><h2 className="text-base font-semibold text-slate-900">Tasks</h2></div>
        <p className="mt-1 text-sm text-slate-600">Break the project into clear next steps.</p>
        <div className="mt-5 space-y-4">
          {tasksError ? <SectionError name="Tasks" /> : <>
            {canManage && <TaskCreateForm projectId={projectId} />}
            {tasks.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center"><CheckSquare className="mx-auto text-slate-400" size={22} /><p className="mt-3 text-sm font-medium text-slate-800">No tasks yet</p><p className="mt-1 text-sm text-slate-500">{canManage ? "Add the first actionable step for this project." : "Tasks shared by your service provider will appear here."}</p></div> : <ul className="space-y-3">{tasks.map((task) => <TaskRow key={task.id} task={task} projectId={projectId} canManage={canManage} />)}</ul>}
          </>}
        </div>
      </article>
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2"><Flag className="text-slate-500" size={18} /><h2 className="text-base font-semibold text-slate-900">Milestones</h2></div>
        <p className="mt-1 text-sm text-slate-600">Track the meaningful moments that move work forward.</p>
        <div className="mt-5 space-y-4">
          {milestonesError ? <SectionError name="Milestones" /> : <>
            {canManage && <MilestoneCreateForm projectId={projectId} />}
            {milestones.length === 0 ? <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center"><Flag className="mx-auto text-slate-400" size={22} /><p className="mt-3 text-sm font-medium text-slate-800">No milestones yet</p><p className="mt-1 text-sm text-slate-500">{canManage ? "Add a key delivery point for this project." : "Milestones shared by your service provider will appear here."}</p></div> : <ul className="space-y-3">{milestones.map((milestone) => <MilestoneRow key={milestone.id} milestone={milestone} projectId={projectId} canManage={canManage} />)}</ul>}
          </>}
        </div>
      </article>
    </section>
  );
}
