"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { archiveTask, deleteTask } from "@/app/tasks/actions";

type Props = {
  taskId: string;
  title: string;
  checkInCount: number;
  /** false for already-archived tasks, where only deleting makes sense */
  allowArchive: boolean;
  onClose: () => void;
  /** called after the action succeeded, before the dialog closes */
  onRemoved?: (choice: "archive" | "delete") => void;
};

export function RemoveTaskDialog({ taskId, title, checkInCount, allowArchive, onClose, onRemoved }: Props) {
  const [choice, setChoice] = useState<"archive" | "delete">(allowArchive ? "archive" : "delete");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const records = `${checkInCount} check-in${checkInCount === 1 ? "" : "s"}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !isPending && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, isPending]);

  function confirm() {
    setError(null);
    startTransition(async () => {
      try {
        if (choice === "archive") await archiveTask(taskId);
        else await deleteTask(taskId);
        onRemoved?.(choice);
        onClose();
      } catch {
        setError("Something went wrong, try again");
      }
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/25 backdrop-blur-[2px] sm:items-center sm:px-4" onClick={() => !isPending && onClose()}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Remove ${title}`}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="w-full max-w-md overflow-hidden rounded-t-2xl border border-line bg-surface shadow-2xl sm:rounded-2xl"
      >
        <div className="px-5 pb-2 pt-5">
          <h2 className="font-display text-2xl font-bold tracking-tight">Remove “{title}”?</h2>
        </div>

        <div className="space-y-2 px-5 pb-5 pt-3">
          {allowArchive && (
            <Option selected={choice === "archive"} onSelect={() => setChoice("archive")} heading="Archive" tag="keeps history">
              Hide it from your board. All {records} stay, count in your stats, and you can restore it from Settings.
            </Option>
          )}
          <Option selected={choice === "delete"} onSelect={() => setChoice("delete")} heading="Delete forever" tag="removes history" danger>
            Erase the task and its {records}
            {` `}and proof attempts. This can’t be undone.
          </Option>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-line bg-canvas/60 px-5 py-3">
          <button type="button" onClick={onClose} disabled={isPending} className="rounded-full px-4 py-2 text-sm text-muted hover:text-ink">
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={isPending}
            className={`btn-ink ${choice === "delete" ? "!bg-red-600" : ""}`}
          >
            {isPending ? "Working…" : choice === "archive" ? "Archive task" : "Delete forever"}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

function Option({
  selected,
  onSelect,
  heading,
  tag,
  danger,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  heading: string;
  tag: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`block w-full rounded-xl border p-3.5 text-left transition ${
        selected ? (danger ? "border-red-600 bg-red-50" : "border-ink bg-canvas") : "border-line hover:border-line-strong"
      }`}
    >
      <span className="flex items-center gap-2">
        <span className="text-[15px] font-semibold">{heading}</span>
        <span className="tag" style={{ backgroundColor: danger ? "#dc2626" : "var(--tag-normal)" }}>
          {tag}
        </span>
      </span>
      <span className="mt-1 block text-sm text-muted">{children}</span>
    </button>
  );
}
