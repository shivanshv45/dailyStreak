"use client";

import { useState, useTransition } from "react";
import { restoreTask } from "@/app/tasks/actions";
import { RemoveTaskDialog } from "@/components/RemoveTaskDialog";

export type ArchivedTask = {
  id: string;
  title: string;
  emoji: string | null;
  color: string;
  checkInCount: number;
  archivedLabel: string;
};

export function ArchivedTasks({ tasks }: { tasks: ArchivedTask[] }) {
  const [deleting, setDeleting] = useState<ArchivedTask | null>(null);
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (tasks.length === 0) {
    return <p className="px-5 py-4 text-sm text-muted">Nothing archived</p>;
  }

  return (
    <>
      <ul className="divide-y divide-line">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-3 px-5 py-3.5">
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-display text-base font-extrabold"
              style={{ backgroundColor: `color-mix(in srgb, ${t.color} 18%, white)`, color: t.color }}
            >
              {t.emoji ?? t.title[0]?.toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{t.title}</p>
              <p className="text-xs text-muted">
                {t.checkInCount} check-in{t.checkInCount === 1 ? "" : "s"} · archived {t.archivedLabel}
              </p>
            </div>
            <button
              type="button"
              disabled={isPending && busyId === t.id}
              onClick={() => {
                setBusyId(t.id);
                startTransition(() => restoreTask(t.id));
              }}
              className="rounded-full border border-line px-3.5 py-1.5 text-sm font-medium hover:border-line-strong disabled:opacity-50"
            >
              {isPending && busyId === t.id ? "Restoring…" : "Restore"}
            </button>
            <button type="button" onClick={() => setDeleting(t)} className="rounded-full px-2 py-1.5 text-sm text-muted hover:text-red-600">
              Delete
            </button>
          </li>
        ))}
      </ul>

      {deleting && (
        <RemoveTaskDialog
          taskId={deleting.id}
          title={deleting.title}
          checkInCount={deleting.checkInCount}
          allowArchive={false}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
