"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { saveTimezoneForCurrentUser, signOut } from "@/app/auth/actions";
import { Art } from "@/components/Art";
import { NewTaskProvider, useNewTask } from "./NewTaskContext";
import { Logo } from "./Logo";

export type ShellTask = { id: string; title: string; emoji: string | null; color: string; doneToday: boolean };
type Section = "board" | "stats" | "settings";

const NAV: { key: Section; href: string; label: string; art: string }[] = [
  { key: "board", href: "/", label: "Today", art: "/icons/today.png" },
  { key: "stats", href: "/profile", label: "Stats", art: "/icons/stats.png" },
  { key: "settings", href: "/settings", label: "Settings", art: "/icons/settings.png" },
];

type AppShellProps = {
  active: Section;
  user: { name: string; email: string };
  tasks: ShellTask[];
  timezone: string;
  children: React.ReactNode;
};

export function AppShell({ active, user, tasks, timezone, children }: AppShellProps) {
  return (
    <NewTaskProvider>
      <TimezoneSync timezone={timezone} />
      <div className="min-h-screen md:flex">
        <Sidebar active={active} user={user} tasks={tasks} />
        <div className="min-w-0 flex-1">
          <MobileTopBar />
          <main className="pb-32">{children}</main>
        </div>
        <Dock active={active} />
      </div>
    </NewTaskProvider>
  );
}

function TimezoneSync({ timezone }: { timezone: string }) {
  const router = useRouter();
  useEffect(() => {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone === "UTC" && browserTz && browserTz !== "UTC") {
      saveTimezoneForCurrentUser(browserTz).then(() => router.refresh());
    }
  }, [timezone, router]);
  return null;
}

function Sidebar({ active, user, tasks }: Omit<AppShellProps, "children" | "timezone">) {
  const { open } = useNewTask();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-sidebar md:flex">
      <div className="px-5 pb-5 pt-6">
        <Logo />
      </div>

      <nav className="space-y-0.5 px-2">
        {NAV.map(({ key, href, label, art }) => (
          <Link
            key={key}
            href={href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[15px] transition ${
              active === key ? "bg-sidebar-active font-semibold text-ink" : "text-ink/70 hover:bg-sidebar-active/60 hover:text-ink"
            }`}
          >
            <Art src={art} size={20} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-7 flex items-center justify-between px-5">
        <span className="field-label">Tasks</span>
        <span className="text-[11px] font-semibold text-faint">
          {tasks.filter((t) => t.doneToday).length}/{tasks.length}
        </span>
      </div>
      <div className="mt-2 flex-1 space-y-0.5 overflow-y-auto px-2">
        {tasks.map((t) => (
          <Link
            key={t.id}
            href={`/#t-${t.id}`}
            className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm text-ink/80 hover:bg-sidebar-active/60"
          >
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-sm" style={{ opacity: t.doneToday ? 0.45 : 1 }}>
              {t.emoji ?? <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />}
            </span>
            <span className={`flex-1 truncate ${t.doneToday ? "text-muted line-through decoration-faint" : ""}`}>{t.title}</span>
          </Link>
        ))}
        <button onClick={open} className="w-full rounded-lg px-3 py-1.5 text-left text-sm text-muted hover:bg-sidebar-active/60 hover:text-ink">
          + New task
        </button>
      </div>

      <div className="flex items-center gap-2.5 border-t border-line/70 px-5 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name || "You"}</p>
          <p className="truncate text-[11px] text-muted">{user.email}</p>
        </div>
        <form action={signOut}>
          <button className="rounded-md px-2 py-1 text-xs text-muted hover:bg-sidebar-active hover:text-ink">Sign out</button>
        </form>
      </div>
    </aside>
  );
}

function MobileTopBar() {
  return (
    <div className="flex items-center justify-between border-b border-line bg-sidebar px-4 py-3 md:hidden">
      <Logo />
      <form action={signOut}>
        <button className="text-sm font-medium text-muted">Sign out</button>
      </form>
    </div>
  );
}

const DOCK_KEY = "dailystreak:dock-collapsed";
const dockListeners = new Set<() => void>();

function readDockCollapsed(): boolean {
  try {
    return localStorage.getItem(DOCK_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDockCollapsed(value: boolean) {
  try {
    localStorage.setItem(DOCK_KEY, value ? "1" : "0");
  } catch {}
  dockListeners.forEach((notify) => notify());
}

function subscribeDock(notify: () => void) {
  dockListeners.add(notify);
  const onStorage = (e: StorageEvent) => e.key === DOCK_KEY && notify();
  window.addEventListener("storage", onStorage);
  return () => {
    dockListeners.delete(notify);
    window.removeEventListener("storage", onStorage);
  };
}

function Dock({ active }: { active: Section }) {
  const { open } = useNewTask();
  const collapsed = useSyncExternalStore(subscribeDock, readDockCollapsed, () => false);
  const [animate, setAnimate] = useState(false);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 md:pl-60">
      <div
        className="pointer-events-auto relative pb-5"
        style={{
          transform: collapsed ? "translateY(100%)" : "translateY(0)",
          transition: animate ? "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)" : "none",
          paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))",
        }}
      >
        <button
          type="button"
          onClick={() => {
            setAnimate(true);
            writeDockCollapsed(!collapsed);
          }}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Show menu" : "Hide menu"}
          className="absolute -top-7 left-1/2 flex h-7 -translate-x-1/2 items-center gap-2 rounded-t-full border border-b-0 border-ink/15 bg-sidebar px-5 text-[11px] font-bold uppercase tracking-wider text-ink shadow-[0_-4px_14px_rgba(70,30,55,0.1)] transition-colors hover:bg-sidebar-active"
        >
          <span className="h-1 w-6 rounded-full bg-ink/40" />
          {collapsed && <span>Menu</span>}
        </button>

        <div className="flex items-center gap-1 rounded-full border border-ink/15 bg-sidebar p-1.5 shadow-[0_14px_28px_-12px_rgba(70,30,55,0.35)]">
          {NAV.map(({ key, href, label, art }) => (
            <Link
              key={key}
              href={href}
              tabIndex={collapsed ? -1 : 0}
              className={`flex h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition ${
                active === key ? "bg-white text-ink shadow-sm" : "text-ink/75 hover:bg-white/60 hover:text-ink"
              }`}
            >
              <Art src={art} size={18} />
              {label}
            </Link>
          ))}
          <span className="mx-1 h-6 w-px bg-ink/15" />
          <button onClick={open} tabIndex={collapsed ? -1 : 0} className="btn-ink h-10 px-4">
            + New
          </button>
        </div>
      </div>
    </div>
  );
}
