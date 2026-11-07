"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  Calendar,
  Compass,
  Inbox,
  LayoutDashboard,
  Map,
  Megaphone,
  Menu,
  Plug,
  Search,
  Settings,
  Sparkles,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/actions/auth";

const ICONS: Record<string, typeof LayoutDashboard> = {
  "/overview": LayoutDashboard,
  "/leads": Users,
  "/pipeline": Sparkles,
  "/contacts": Users,
  "/bookings": Compass,
  "/packages": Map,
  "/inbox": Inbox,
  "/social": Calendar,
  "/automation": Workflow,
  "/campaigns": Megaphone,
  "/reports": LayoutDashboard,
  "/reports/register": LayoutDashboard,
  "/partners": Users,
  "/team": Users,
  "/audit": Search,
  "/approvals": Sparkles,
  "/operations": Compass,
  "/website": LayoutDashboard,
  "/sales": Sparkles,
  "/departures": Compass,
  "/travellers": Users,
  "/integrations": Plug,
  "/settings": Settings,
};

export function AppShell({
  children,
  profileName,
  notificationCount,
  navItems,
}: {
  children: React.ReactNode;
  profileName: string;
  notificationCount: number;
  navItems: Array<{ href: string; label: string; group?: "main" | "admin" }>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "fixed inset-y-0 z-40 border-r border-line bg-surface transition-all lg:static",
            open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            collapsed ? "w-20" : "w-72",
          )}
        >
          <div className="flex h-16 items-center justify-between px-4">
            <Link href="/overview" className="font-serif text-xl">
              {collapsed ? "N" : "Northridge"}
            </Link>
            <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="space-y-1 px-3 pb-8">
            {(["main", "admin"] as const).map((group) => {
              const groupItems = navItems.filter((item) => (item.group ?? "main") === group);
              if (!groupItems.length) return null;
              return (
                <div key={group} className="mb-4">
                  {!collapsed ? (
                    <p className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-[0.16em] text-muted">
                      {group === "main" ? "Operations" : "Business management"}
                    </p>
                  ) : null}
                  {groupItems.map((item) => {
                    const Icon = ICONS[item.href] ?? LayoutDashboard;
                    const active = pathname === item.href || (item.href !== "/reports" && pathname.startsWith(`${item.href}/`));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                          active ? "bg-accent-soft text-accent" : "text-muted hover:bg-accent-soft hover:text-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed ? item.label : null}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <button
              className="hidden rounded-md border border-line px-2 py-1 text-xs lg:inline"
              onClick={() => setCollapsed((value) => !value)}
            >
              {collapsed ? "Expand" : "Collapse"}
            </button>
            <form action="/sales" className="relative max-w-xl flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <input
                name="q"
                placeholder="Search leads, destinations, campaigns"
                className="w-full rounded-md border border-line bg-background py-2 pl-9 pr-3 text-sm"
              />
            </form>
            <Link href="/leads?new=1" className="hidden rounded-md bg-accent px-3 py-2 text-sm text-white sm:inline">
              Quick create
            </Link>
            <Link href="/overview" className="relative rounded-md border border-line p-2" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {notificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 rounded-full bg-danger px-1 text-[10px] text-white">
                  {notificationCount}
                </span>
              ) : null}
            </Link>
            <form action={signOutAction}>
              <button className="rounded-md border border-line px-3 py-1.5 text-sm">{profileName}</button>
            </form>
          </header>
          <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
