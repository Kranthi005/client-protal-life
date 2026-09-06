import {
  CheckCircle2,
  CircleAlert,
  FileText,
  Flag,
  MessageSquare,
  Plus,
  RefreshCw,
  Upload,
} from "lucide-react";
import type { Activity } from "@/lib/supabase/types";

type ProjectActivityTimelineProps = {
  activities: Activity[];
};

function activityIcon(type: string) {
  switch (type) {
    case "PROJECT_CREATED":
      return Plus;
    case "TASK_UPDATED":
    case "MILESTONE_UPDATED":
      return RefreshCw;
    case "FILE_UPLOADED":
      return Upload;
    case "DELIVERABLE_UPDATED":
      return FileText;
    case "FEEDBACK_ADDED":
      return MessageSquare;
    case "APPROVAL_REQUESTED":
      return Flag;
    case "APPROVAL_REVIEWED":
      return CheckCircle2;
    case "RISK_DETECTED":
      return CircleAlert;
    default:
      return CircleAlert;
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function ProjectActivityTimeline({
  activities,
}: ProjectActivityTimelineProps) {
  return (
    <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          Activity timeline
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          A chronological record of important project updates.
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
          <p className="text-sm font-medium text-slate-700">No activity yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Important project updates will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          {activities.map((activity, index) => {
            const Icon = activityIcon(activity.type);
            const isLast = index === activities.length - 1;

            return (
              <div key={activity.id} className="relative flex gap-4">
                {!isLast && (
                  <div className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-px bg-slate-200" />
                )}

                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
                  <Icon size={15} />
                </div>

                <div className={`min-w-0 flex-1 ${isLast ? "" : "pb-6"}`}>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {activity.title}
                    </p>

                    <time
                      dateTime={activity.created_at}
                      className="shrink-0 text-xs text-slate-400"
                    >
                      {formatDate(activity.created_at)}
                    </time>
                  </div>

                  {activity.description && (
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {activity.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
