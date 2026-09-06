import { CheckCircle2, Download, FileText, Trash2, Upload } from "lucide-react";
import {
  createDeliverable,
  deleteDeliverable,
  deleteProjectFile,
  updateDeliverableStatus,
  uploadProjectFile,
} from "@/app/(app)/projects/files-deliverables-actions";
import type {
  Deliverable,
  DeliverableStatus,
  ProjectFile,
} from "@/lib/supabase/types";

type FileWithUrl = ProjectFile & {
  signedUrl: string | null;
};

type ProjectFilesDeliverablesProps = {
  projectId: string;
  files: FileWithUrl[];
  deliverables: Deliverable[];
  canManage: boolean;
};

const deliverableStatusLabels: Record<DeliverableStatus, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  APPROVED: "Approved",
};

const deliverableStatusClasses: Record<DeliverableStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  IN_REVIEW: "bg-amber-50 text-amber-800",
  APPROVED: "bg-emerald-50 text-emerald-800",
};

function formatFileSize(size: number | null) {
  if (size === null) return "Unknown size";

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectFilesDeliverables({
  projectId,
  files,
  deliverables,
  canManage,
}: ProjectFilesDeliverablesProps) {
  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-2">
      {/* FILES */}
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Project files
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Shared files and project assets.
            </p>
          </div>

          <FileText className="text-slate-400" size={20} />
        </div>

        {canManage && (
          <form
            action={uploadProjectFile}
            className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4"
          >
            <input type="hidden" name="project_id" value={projectId} />

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Upload a file
              </span>

              <input
                type="file"
                name="file"
                required
                className="mt-2 block w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
              />
            </label>

            <p className="mt-2 text-xs text-slate-500">
              Maximum file size: 10 MB.
            </p>

            <button
              type="submit"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Upload size={16} />
              Upload file
            </button>
          </form>
        )}

        <div className="mt-5 space-y-3">
          {files.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center">
              <p className="text-sm font-medium text-slate-700">No files yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Upload project files to make them available here.
              </p>
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <FileText size={17} className="text-slate-500" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {file.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatFileSize(file.size_bytes)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {file.signedUrl && (
                    <a
                      href={file.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Download size={14} />
                      Open
                    </a>
                  )}

                  {canManage && (
                    <form action={deleteProjectFile}>
                      <input
                        type="hidden"
                        name="project_id"
                        value={projectId}
                      />
                      <input type="hidden" name="file_id" value={file.id} />

                      <button
                        type="submit"
                        aria-label={`Delete ${file.name}`}
                        className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </article>

      {/* DELIVERABLES */}
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Deliverables
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Track work that is ready for client review.
            </p>
          </div>

          <CheckCircle2 className="text-slate-400" size={20} />
        </div>

        {canManage && (
          <form
            action={createDeliverable}
            className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            <input type="hidden" name="project_id" value={projectId} />

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Deliverable title
              </span>
              <input
                type="text"
                name="title"
                required
                maxLength={160}
                placeholder="e.g. Homepage design"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">
                Description
              </span>
              <textarea
                name="description"
                rows={3}
                maxLength={5000}
                placeholder="Briefly describe this deliverable..."
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">
                Attach file
              </span>

              <select
                name="file_id"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
              >
                <option value="">No file attached</option>

                {files.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <CheckCircle2 size={16} />
              Create deliverable
            </button>
          </form>
        )}

        <div className="mt-5 space-y-3">
          {deliverables.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center">
              <p className="text-sm font-medium text-slate-700">
                No deliverables yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Create a deliverable when a piece of work is ready.
              </p>
            </div>
          ) : (
            deliverables.map((deliverable) => (
              <div
                key={deliverable.id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {deliverable.title}
                    </p>

                    {deliverable.description && (
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {deliverable.description}
                      </p>
                    )}
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${deliverableStatusClasses[deliverable.status]}`}
                  >
                    {deliverableStatusLabels[deliverable.status]}
                  </span>
                </div>

                {canManage && (
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <form
                      action={updateDeliverableStatus}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="hidden"
                        name="project_id"
                        value={projectId}
                      />
                      <input
                        type="hidden"
                        name="deliverable_id"
                        value={deliverable.id}
                      />

                      <select
                        name="status"
                        defaultValue={deliverable.status}
                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="IN_REVIEW">In review</option>
                        <option value="APPROVED">Approved</option>
                      </select>

                      <button
                        type="submit"
                        className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Update
                      </button>
                    </form>

                    <form action={deleteDeliverable}>
                      <input
                        type="hidden"
                        name="project_id"
                        value={projectId}
                      />
                      <input
                        type="hidden"
                        name="deliverable_id"
                        value={deliverable.id}
                      />

                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </article>
    </section>
  );
}
