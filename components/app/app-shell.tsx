"use client";

import Link from "next/link";
import {
  Activity,
  Bell,
  CheckSquare,
  Files,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Settings,
} from "lucide-react";
import { logout } from "@/app/auth/actions";
import type { Profile } from "@/lib/supabase/types";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/files", label: "Files", icon: Files },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  profile,
  email,
}: {
  children: React.ReactNode;
  profile: Profile | null;
  email: string;
}) {
  const displayName = profile?.full_name || email.split("@")[0];
  const role = profile?.role === "CLIENT" ? "Client" : "Service provider";

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <Link href="/dashboard">
            <span className="text-xl font-bold tracking-tight text-slate-950">
              NEXUS
            </span>
            <span className="mt-1 block text-[11px] font-medium text-slate-500">
              Intelligent Client Project Portal
            </span>
          </Link>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:pb-0">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto hidden border-t border-slate-200 p-4 lg:block">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {displayName.slice(0, 1).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {displayName}
              </p>
              <p className="text-xs text-slate-500">{role}</p>
            </div>
          </div>

          <form action={logout}>
            <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950">
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:ml-64 lg:w-[calc(100%-16rem)]">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 lg:px-8">
          <p className="text-sm font-medium text-slate-500">Your workspace</p>

          <div className="flex items-center gap-2">
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              <Bell size={19} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-slate-900" />
            </Link>

            <div className="flex items-center gap-2 lg:hidden">
              <span className="text-sm font-medium text-slate-700">
                {displayName}
              </span>

              <form action={logout}>
                <button
                  aria-label="Sign out"
                  className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
                >
                  <LogOut size={17} />
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
