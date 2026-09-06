"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, Search, XCircle } from "lucide-react";
import type { Project, ProjectStatus } from "@/lib/supabase/types";

const statusOptions: Array<{
  value: "ALL" | ProjectStatus;
  label: string;
}> = [
  { value: "ALL", label: "All statuses" },
  { value: "PLANNING", label: "Planning" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "COMPLETED", label: "Completed" },
];

function formatDate(date: string | null) {
  if (!date) return "No deadline";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function statusLabel(status: ProjectStatus) {
  switch (status) {
    case "PLANNING":
      return "Planning";
    case "IN_PROGRESS":
      return "In progress";
    case "ON_HOLD":
      return "On hold";
    case "COMPLETED":
      return "Completed";
    default:
      return status;
  }
}

function statusClasses(status: ProjectStatus) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";
    case "IN_PROGRESS":
      return "bg-blue-50 text-blue-700";
    case "ON_HOLD":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getProjectHealth(project: Project) {
  if (project.status === "COMPLETED") {
    return {
      label: "Healthy",
      classes: "bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    };
  }

  if (project.due_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(`${project.due_date}T00:00:00`);

    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - today.getTime()) / 86400000,
    );

    if (daysUntilDue < 0) {
      return {
        label: "Overdue",
        classes: "bg-rose-50 text-rose-700",
        dot: "bg-rose-500",
      };
    }

    if (daysUntilDue <= 7 && project.progress < 70) {
      return {
        label: "At risk",
        classes: "bg-amber-50 text-amber-700",
        dot: "bg-amber-500",
      };
    }
  }

  if (project.progress >= 70) {
    return {
      label: "Healthy",
      classes: "bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    };
  }

  return {
    label: "On track",
    classes: "bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  };
}

export function ProjectFilters({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | ProjectStatus>("ALL");

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesStatus = status === "ALL" || project.status === status;

      const matchesQuery =
        !normalizedQuery ||
        project.name.toLowerCase().includes(normalizedQuery) ||
        (project.client_name ?? "").toLowerCase().includes(normalizedQuery) ||
        (project.description ?? "").toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [projects, query, status]);

  const clearFilters = () => {
    setQuery("");
    setStatus("ALL");
  };

  return (
    <section className="mt-8">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects, clients, or descriptions..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "ALL" | ProjectStatus)
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {(query || status !== "ALL") && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <XCircle size={16} />
              Clear
            </button>
          )}
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Showing {filteredProjects.length} of {projects.length} projects
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <Search className="mx-auto text-slate-400" size={28} />

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            No matching projects
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Try a different search term or status filter.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {filteredProjects.map((project) => {
            const health = getProjectHealth(project);

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-slate-900 group-hover:text-slate-700">
                      {project.name}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {project.client_name || "No client assigned"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap justify-end gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${health.classes}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${health.dot}`}
                      />
                      {health.label}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(
                        project.status,
                      )}`}
                    >
                      {statusLabel(project.status)}
                    </span>
                  </div>
                </div>

                {project.description && (
                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
                    {project.description}
                  </p>
                )}

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-500">Progress</span>

                    <span className="font-semibold text-slate-900">
                      {project.progress}%
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-900 transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    {project.status === "COMPLETED" ? (
                      <CheckCircle2 size={14} />
                    ) : project.status === "ON_HOLD" ? (
                      <XCircle size={14} />
                    ) : (
                      <Clock3 size={14} />
                    )}

                    {formatDate(project.due_date)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
