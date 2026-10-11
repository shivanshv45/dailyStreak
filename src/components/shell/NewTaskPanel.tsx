"use client";

import { useEffect, useState, useTransition } from "react";
import { motion } from "motion/react";
import { createTask } from "@/app/tasks/actions";
import { TASK_COLORS } from "@/lib/colors";
import { cadenceLabel, MAX_INTERVAL, MIN_INTERVAL, type Frequency } from "@/lib/frequency";

export function NewTaskPanel({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"NORMAL" | "PROOF">("NORMAL");
  const [frequency, setFrequency] = useState<Frequency>("DAILY");
  const [intervalInput, setIntervalInput] = useState("2");
  const interval = Number(intervalInput);
  const intervalValid = Number.isInteger(interval) && interval >= MIN_INTERVAL && interval <= MAX_INTERVAL;
  const [color, setColor] = useState(TASK_COLORS[0]);
  const [confirmedLock, setConfirmedLock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSubmit(formData: FormData) {
    if (mode === "PROOF" && !confirmedLock) return;
    if (frequency === "CUSTOM" && !intervalValid) return;
    formData.set("mode", mode);
    formData.set("frequency", frequency);
    if (frequency === "CUSTOM") formData.set("intervalDays", String(interval));
    formData.set("color", color);
    setError(null);
    startTransition(async () => {
      try {
        await createTask(formData);
        onClose();
      } catch {
        setError("Couldn't create the task");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/20 backdrop-blur-[2px] sm:items-center sm:px-4" onClick={onClose}>
      <motion.form
        action={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="w-full max-w-lg overflow-hidden rounded-t-2xl border border-line bg-surface shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3 text-xs text-muted">
          <span>
            Tasks <span className="mx-1 text-faint">/</span> <span className="text-ink">New</span>
          </span>
          <button type="button" onClick={onClose} className="rounded-md px-2 py-0.5 text-xs hover:bg-canvas hover:text-ink">
            esc
          </button>
        </div>

        <div className="px-5 pb-5 pt-4">
          <div className="flex items-center gap-3">
            <input
              name="emoji"
              maxLength={4}
              placeholder="✦"
              aria-label="Emoji"
              className="h-11 w-11 shrink-0 rounded-lg border border-line bg-canvas text-center text-xl outline-none focus:border-pink"
            />
            <input
              name="title"
              required
              maxLength={60}
              autoFocus
              placeholder="Untitled task"
              className="w-full bg-transparent font-display text-2xl font-bold tracking-tight outline-none placeholder:text-faint"
            />
          </div>
          <input
            name="description"
            maxLength={120}
            placeholder="One-line description"
            className="mt-2 w-full bg-transparent text-sm text-muted outline-none placeholder:text-faint"
          />

          <div className="mt-5 grid grid-cols-[96px_1fr] items-center gap-x-3 gap-y-4">
            <span className="field-label">Repeat</span>
            <div className="inline-flex w-fit flex-wrap rounded-lg border border-line bg-canvas p-0.5 text-sm">
              {(["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={`rounded-md px-3 py-1.5 font-medium transition ${frequency === f ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
                >
                  {f === "CUSTOM" ? "Custom" : cadenceLabel({ frequency: f, intervalDays: null })}
                </button>
              ))}
            </div>

            {frequency === "CUSTOM" && (
              <>
                <span className="field-label">Every</span>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas px-2.5 py-1 focus-within:border-pink">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={MIN_INTERVAL}
                      max={MAX_INTERVAL}
                      value={intervalInput}
                      onChange={(e) => setIntervalInput(e.target.value)}
                      aria-label="Repeat every how many days"
                      className="w-12 bg-transparent text-center font-display text-lg font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-sm text-muted">days</span>
                  </div>
                  {[2, 3, 10, 14].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setIntervalInput(String(n))}
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                        intervalInput === String(n) ? "border-ink bg-ink text-white" : "border-line text-muted hover:border-line-strong hover:text-ink"
                      }`}
                    >
                      {n}d
                    </button>
                  ))}
                </div>
              </>
            )}

            <span className="field-label">Check</span>
            <div className="inline-flex w-fit rounded-lg border border-line bg-canvas p-0.5 text-sm">
              {(["NORMAL", "PROOF"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-md px-3 py-1.5 font-medium transition ${mode === m ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
                >
                  {m === "NORMAL" ? "Tick it" : "Proof"}
                </button>
              ))}
            </div>

            <span className="field-label">Color</span>
            <div className="flex gap-2">
              {TASK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                  className="h-6 w-6 rounded-md ring-offset-2 transition"
                  style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined }}
                />
              ))}
            </div>

            {mode === "PROOF" && (
              <>
                <span className="field-label self-start pt-2">Done means</span>
                <textarea
                  name="doneCriteria"
                  maxLength={200}
                  rows={2}
                  placeholder="Screenshot shows a green “Accepted”"
                  className="input resize-none text-sm"
                />
              </>
            )}
          </div>

          {mode === "PROOF" && (
            <label className="mt-4 flex cursor-pointer items-center gap-2.5 rounded-lg border border-dashed border-line-strong px-3 py-2.5 text-sm">
              <span className="flex-1">Proof mode is locked once created</span>
              <input type="checkbox" checked={confirmedLock} onChange={(e) => setConfirmedLock(e.target.checked)} className="h-4 w-4 accent-[var(--ink)]" />
            </label>
          )}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-line bg-canvas/60 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm text-muted hover:text-ink">
            Cancel
          </button>
          <button type="submit" disabled={isPending || (mode === "PROOF" && !confirmedLock) || (frequency === "CUSTOM" && !intervalValid)} className="btn-ink">
            {isPending ? "Creating…" : "Create task"}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
