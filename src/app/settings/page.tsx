import { requireAppContext, getShellTasks } from "@/lib/session";
import { AppShell } from "@/components/shell/AppShell";
import { signOut } from "@/app/auth/actions";
import { prisma } from "@/lib/db/prisma";
import { TimezoneField } from "./TimezoneField";
import { ArchivedTasks, type ArchivedTask } from "./ArchivedTasks";

export const instant = false;

export default async function SettingsPage() {
  const { user, timezone } = await requireAppContext();
  const [shellTasks, archivedRaw] = await Promise.all([
    getShellTasks(user.id, timezone),
    prisma.task.findMany({
      where: { userId: user.id, archivedAt: { not: null } },
      select: { id: true, title: true, emoji: true, color: true, archivedAt: true, _count: { select: { checkIns: true } } },
      orderBy: { archivedAt: "desc" },
    }),
  ]);
  const zones = Intl.supportedValuesOf("timeZone");
  const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: timezone });
  const archived: ArchivedTask[] = archivedRaw.map((t) => ({
    id: t.id,
    title: t.title,
    emoji: t.emoji,
    color: t.color,
    checkInCount: t._count.checkIns,
    archivedLabel: dateFmt.format(t.archivedAt!),
  }));

  return (
    <AppShell active="settings" user={user} tasks={shellTasks} timezone={timezone}>
      <div className="mx-auto max-w-2xl px-4 pt-5 md:px-10 md:pt-7">
        <p className="text-xs text-muted">
          Profile <span className="mx-1 text-faint">/</span> <span className="text-ink">Settings</span>
        </p>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight">Settings</h1>

        <div className="mt-8 divide-y divide-line rounded-2xl border border-line bg-surface">
          <Row label="Name">
            <span className="text-sm">{user.name || "—"}</span>
          </Row>
          <Row label="Email">
            <span className="text-sm">{user.email}</span>
          </Row>
          <Row label="Timezone">
            <TimezoneField saved={timezone} zones={zones} />
          </Row>
          <Row label="Session">
            <form action={signOut}>
              <button className="rounded-full border border-line px-4 py-1.5 text-sm hover:border-line-strong">Sign out</button>
            </form>
          </Row>
        </div>

        <div className="mt-10 flex items-center gap-2">
          <span className="field-label">Archived tasks</span>
          <span className="text-xs font-semibold text-muted">{archived.length}</span>
        </div>
        <div className="mt-3 rounded-2xl border border-line bg-surface">
          <ArchivedTasks tasks={archived} />
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[120px_1fr] sm:items-center">
      <span className="field-label">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
