import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  MessageSquare,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type Project = {
  id: string;
  name: string;
};

type Deliverable = {
  id: string;
  title: string;
};

function statusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function ApprovalsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: approvals } = await supabase
    .from("approvals")
    .select("id, project_id, deliverable_id, status, comment, created_at")
    .order("created_at", { ascending: false });

  const projectIds = [
    ...new Set((approvals ?? []).map((item) => item.project_id)),
  ];

  const deliverableIds = [
    ...new Set((approvals ?? []).map((item) => item.deliverable_id)),
  ];

  const [{ data: projects }, { data: deliverables }] = await Promise.all([
    projectIds.length
      ? supabase.from("projects").select("id, name").in("id", projectIds)
      : Promise.resolve({ data: [] as Project[] }),

    deliverableIds.length
      ? supabase
          .from("deliverables")
          .select("id, title")
          .in("id", deliverableIds)
      : Promise.resolve({
          data: [] as Deliverable[],
        }),
  ]);

  const projectMap = new Map(
    (projects ?? []).map((project) => [project.id, project.name]),
  );

  const deliverableMap = new Map(
    (deliverables ?? []).map((deliverable) => [
      deliverable.id,
      deliverable.title,
    ]),
  );

  const allApprovals = approvals ?? [];

  const pending = allApprovals.filter(
    (approval) => approval.status === "PENDING",
  );

  const approved = allApprovals.filter(
    (approval) => approval.status === "APPROVED",
  );

  const changesRequested = allApprovals.filter(
    (approval) => approval.status === "CHANGES_REQUESTED",
  );

  return (
    <>
      <div>
        <p className="text-sm font-medium text-slate-500">Workspace</p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
          Approval Inbox
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Review deliverables and keep client approvals moving.
        </p>
      </div>

      {/* Summary cards */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-amber-800">Pending</p>
            <Clock3 size={19} className="text-amber-600" />
          </div>

          <p className="mt-4 text-3xl font-semibold text-amber-950">
            {pending.length}
          </p>

          <p className="mt-1 text-xs text-amber-700">Awaiting review</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-emerald-800">Approved</p>
            <CheckCircle2 size={19} className="text-emerald-600" />
          </div>

          <p className="mt-4 text-3xl font-semibold text-emerald-950">
            {approved.length}
          </p>

          <p className="mt-1 text-xs text-emerald-700">Successfully approved</p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-red-800">
              Changes requested
            </p>
            <XCircle size={19} className="text-red-600" />
          </div>

          <p className="mt-4 text-3xl font-semibold text-red-950">
            {changesRequested.length}
          </p>

          <p className="mt-1 text-xs text-red-700">Need another revision</p>
        </div>
      </section>

      {/* Approval list */}
      <section className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">All approvals</h2>

            <p className="mt-1 text-sm text-slate-500">
              {allApprovals.length} approval
              {allApprovals.length === 1 ? "" : "s"} across your projects.
            </p>
          </div>

          <FileCheck2 size={20} className="text-slate-400" />
        </div>

        {allApprovals.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <FileCheck2 size={32} className="mx-auto text-slate-300" />

            <h3 className="mt-4 font-medium text-slate-900">
              No approvals yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Approval requests will appear here when a deliverable is ready for
              client review.
            </p>

            <Link
              href="/projects"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              View projects
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {allApprovals.map((approval) => {
              const status = approval.status;

              const statusStyles =
                status === "APPROVED"
                  ? "bg-emerald-50 text-emerald-700"
                  : status === "CHANGES_REQUESTED"
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700";

              return (
                <div
                  key={approval.id}
                  className="px-5 py-5 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <FileCheck2 size={18} className="text-slate-500" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-medium text-slate-900">
                          {deliverableMap.get(approval.deliverable_id) ??
                            "Deliverable"}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {projectMap.get(approval.project_id) ?? "Project"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Requested {formatDate(approval.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-medium ${statusStyles}`}
                      >
                        {statusLabel(status)}
                      </span>

                      <Link
                        href={`/projects/${approval.project_id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white"
                      >
                        Open project
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>

                  {approval.comment && (
                    <div className="mt-4 ml-14 flex gap-2 rounded-lg bg-slate-50 p-3">
                      <MessageSquare
                        size={15}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />

                      <p className="text-sm leading-5 text-slate-600">
                        {approval.comment}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
