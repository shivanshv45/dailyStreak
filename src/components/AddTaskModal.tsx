"use client";

import { useState, useTransition } from "react";
import { createTask } from "@/app/tasks/actions";

const COLORS = ["#6366f1", "#ef4444", "#22c55e", "#eab308", "#ec4899", "#06b6d4"];

export function AddTaskModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"NORMAL" | "PROOF">("NORMAL");
  const [color, setColor] = useState(COLORS[0]);
  const [confirmedLock, setConfirmedLock] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    if (mode === "PROOF" && !confirmedLock) return;
    formData.set("mode", mode);
    formData.set("color", color);
    startTransition(async () => {
      await createTask(formData);
      setOpen(false);
      setMode("NORMAL");
      setConfirmedLock(false);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-full min-h-[128px] w-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-800 text-neutral-500 transition hover:border-neutral-600 hover:text-neutral-300"
      >
        + Add task
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setOpen(false)}>
      <form
        action={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
      >
        <h2 className="mb-4 text-lg font-semibold text-white">New task</h2>

        <div className="space-y-3">
          <input
            name="title"
            placeholder="Title"
            required
            maxLength={60}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500 outline-none focus:border-indigo-500"
          />
          <input
            name="description"
            placeholder="Description (optional)"
            maxLength={120}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500 outline-none focus:border-indigo-500"
          />
          <input
            name="emoji"
            placeholder="Emoji (optional)"
            maxLength={8}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500 outline-none focus:border-indigo-500"
          />

          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-8 w-8 rounded-full border-2"
                style={{ backgroundColor: c, borderColor: color === c ? "white" : "transparent" }}
              />
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMode("NORMAL")}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm ${mode === "NORMAL" ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-neutral-700 text-neutral-400"}`}
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => setMode("PROOF")}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm ${mode === "PROOF" ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-neutral-700 text-neutral-400"}`}
            >
              Proof (AI-verified)
            </button>
          </div>

          {mode === "PROOF" && (
            <div className="space-y-2 rounded-lg border border-amber-800/50 bg-amber-950/30 p-3">
              <textarea
                name="doneCriteria"
                placeholder="What counts as done? (e.g. screenshot must show green Accepted status)"
                maxLength={200}
                rows={2}
                className="w-full resize-none rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-indigo-500"
              />
              <label className="flex items-center gap-2 text-xs text-amber-300">
                <input
                  type="checkbox"
                  checked={confirmedLock}
                  onChange={(e) => setConfirmedLock(e.target.checked)}
                />
                I understand proof mode can&apos;t be changed after creating this task
              </label>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm text-neutral-400">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || (mode === "PROOF" && !confirmedLock)}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
