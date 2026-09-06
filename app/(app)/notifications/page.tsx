import Link from "next/link";
import { Bell, Check, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/(app)/projects/activity-actions";

type Notification = {
  id: string;
  project_id: string | null;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, project_id, title, message, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const items = (notifications ?? []) as Notification[];
  const unreadCount = items.filter((item) => !item.read_at).length;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Workspace</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Notifications
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Stay up to date with project activity, feedback, approvals, and
            important updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <form action={markAllNotificationsRead}>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>
          </form>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Bell className="mx-auto text-slate-400" size={32} />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              You&apos;re all caught up
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              New project updates and notifications will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((notification) => (
              <div
                key={notification.id}
                className={`flex gap-4 px-5 py-5 ${
                  notification.read_at ? "bg-white" : "bg-slate-50/70"
                }`}
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                  <Bell size={17} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {notification.message}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs text-slate-400">
                      {new Date(notification.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    {notification.project_id && (
                      <Link
                        href={`/projects/${notification.project_id}`}
                        className="text-sm font-medium text-slate-900 underline underline-offset-4 hover:text-slate-600"
                      >
                        View project
                      </Link>
                    )}

                    {!notification.read_at && (
                      <form action={markNotificationRead}>
                        <input
                          type="hidden"
                          name="notification_id"
                          value={notification.id}
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
                        >
                          <Check size={15} />
                          Mark as read
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {!notification.read_at && (
                  <span
                    aria-label="Unread"
                    className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-900"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
