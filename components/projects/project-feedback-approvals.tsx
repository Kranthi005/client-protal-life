import { CheckCircle2, MessageSquare, Send, XCircle } from "lucide-react";
import {
  createFeedback,
  requestApproval,
  reviewApproval,
} from "@/app/(app)/projects/feedback-actions";
import type {
  Approval,
  Deliverable,
  Feedback,
  Profile,
} from "@/lib/supabase/types";

type ProjectFeedbackApprovalsProps = {
  projectId: string;
  feedback: Feedback[];
  approvals: Approval[];
  deliverables: Deliverable[];
  currentUserId: string;
  currentUserRole: Profile["role"];
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

const approvalStatusLabels = {
  PENDING: "Pending",
  APPROVED: "Approved",
  CHANGES_REQUESTED: "Changes requested",
} as const;

const approvalStatusClasses = {
  PENDING: "bg-amber-50 text-amber-800",
  APPROVED: "bg-emerald-50 text-emerald-800",
  CHANGES_REQUESTED: "bg-red-50 text-red-700",
} as const;

export function ProjectFeedbackApprovals({
  projectId,
  feedback,
  approvals,
  deliverables,
  currentUserId,
  currentUserRole,
}: ProjectFeedbackApprovalsProps) {
  const canRequestApproval = currentUserRole === "SERVICE_PROVIDER";
  const isClient = currentUserRole === "CLIENT";

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-2">
      {/* FEEDBACK */}
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <MessageSquare size={18} className="text-slate-600" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Client feedback
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Keep project discussions and decisions in one place.
            </p>
          </div>
        </div>

        <form
          action={createFeedback}
          className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4"
        >
          <input type="hidden" name="project_id" value={projectId} />

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Add feedback
            </span>

            <textarea
              name="message"
              required
              maxLength={5000}
              rows={4}
              placeholder="Share feedback, questions, or project updates..."
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-700">
              Related deliverable
            </span>

            <select
              name="deliverable_id"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
            >
              <option value="">General project feedback</option>

              {deliverables.map((deliverable) => (
                <option key={deliverable.id} value={deliverable.id}>
                  {deliverable.title}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Send size={16} />
            Post feedback
          </button>
        </form>

        <div className="mt-5 space-y-3">
          {feedback.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center">
              <p className="text-sm font-medium text-slate-700">
                No feedback yet
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Project discussion will appear here.
              </p>
            </div>
          ) : (
            feedback.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {item.message}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>
                    {item.author_id === currentUserId
                      ? "You"
                      : "Project member"}
                  </span>

                  <span>•</span>

                  <span>{formatDate(item.created_at)}</span>

                  {item.deliverable_id && (
                    <>
                      <span>•</span>

                      <span>
                        {deliverables.find(
                          (deliverable) =>
                            deliverable.id === item.deliverable_id,
                        )?.title || "Deliverable"}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </article>

      {/* APPROVALS */}
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <CheckCircle2 size={18} className="text-slate-600" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Approvals
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Request and track client decisions on deliverables.
            </p>
          </div>
        </div>

        {canRequestApproval && (
          <form
            action={requestApproval}
            className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            <input type="hidden" name="project_id" value={projectId} />

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Request approval for
              </span>

              <select
                name="deliverable_id"
                required
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
              >
                <option value="">Select a deliverable</option>

                {deliverables.map((deliverable) => (
                  <option key={deliverable.id} value={deliverable.id}>
                    {deliverable.title}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Send size={16} />
              Request approval
            </button>
          </form>
        )}

        <div className="mt-5 space-y-3">
          {approvals.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center">
              <p className="text-sm font-medium text-slate-700">
                No approval requests yet
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Approval requests will appear here.
              </p>
            </div>
          ) : (
            approvals.map((approval) => {
              const deliverable = deliverables.find(
                (item) => item.id === approval.deliverable_id,
              );

              return (
                <div
                  key={approval.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {deliverable?.title || "Deliverable"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Requested {formatDate(approval.created_at)}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${approvalStatusClasses[approval.status]}`}
                    >
                      {approvalStatusLabels[approval.status]}
                    </span>
                  </div>

                  {approval.comment && (
                    <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      {approval.comment}
                    </p>
                  )}

                  {approval.status === "PENDING" && isClient && (
                    <form
                      action={reviewApproval}
                      className="mt-4 border-t border-slate-100 pt-4"
                    >
                      <input
                        type="hidden"
                        name="project_id"
                        value={projectId}
                      />

                      <input
                        type="hidden"
                        name="approval_id"
                        value={approval.id}
                      />

                      <label className="block">
                        <span className="text-sm font-medium text-slate-700">
                          Decision comment
                        </span>

                        <textarea
                          name="comment"
                          rows={3}
                          maxLength={5000}
                          placeholder="Add an optional comment..."
                          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                        />
                      </label>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="submit"
                          name="status"
                          value="APPROVED"
                          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          <CheckCircle2 size={16} />
                          Approve
                        </button>

                        <button
                          type="submit"
                          name="status"
                          value="CHANGES_REQUESTED"
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <XCircle size={16} />
                          Request changes
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })
          )}
        </div>
      </article>
    </section>
  );
}
