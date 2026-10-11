"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { restoreTask } from "@/app/tasks/actions";
import { RemoveTaskDialog } from "@/components/RemoveTaskDialog";

type Props = { taskId: string; title: string; checkInCount: number; archived: boolean };

export function TaskActions({ taskId, title, checkInCount, archived }: Props) {
  const router = useRouter();
  const [dialog, setDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {archived && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => restoreTask(taskId))}
          className="rounded-full border-2 border-ink bg-white/85 px-4 py-1.5 text-sm font-semibold hover:bg-white disabled:opacity-50"
        >
          {isPending ? "Restoring…" : "Restore to board"}
        </button>
      )}
      <button type="button" onClick={() => setDialog(true)} className="rounded-full px-3 py-1.5 text-sm font-medium text-ink/70 hover:bg-white hover:text-ink">
        {archived ? "Delete forever" : "Remove task"}
      </button>

      {dialog && (
        <RemoveTaskDialog
          taskId={taskId}
          title={title}
          checkInCount={checkInCount}
          allowArchive={!archived}
          onClose={() => setDialog(false)}
          onRemoved={(choice) => (choice === "delete" ? router.push("/profile") : router.refresh())}
        />
      )}
    </div>
  );
}
