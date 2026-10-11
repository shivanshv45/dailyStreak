"use client";

import { useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toggleCheckIn } from "@/app/tasks/actions";

type TaskCardProps = {
  id: string;
  title: string;
  emoji: string | null;
  color: string;
  mode: "NORMAL" | "PROOF";
  streak: number;
  doneToday: boolean;
  last7: boolean[];
};

export function TaskCard({ id, title, emoji, color, mode, streak, doneToday, last7 }: TaskCardProps) {
  const [isPending, startTransition] = useTransition();
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleNormalToggle() {
    if (mode !== "NORMAL" || isPending) return;
    startTransition(() => toggleCheckIn(id));
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsVerifying(true);
    setVerifyError(null);

    const body = new FormData();
    body.set("taskId", id);
    body.set("image", file);

    try {
      const res = await fetch("/api/verify", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setVerifyError(json.error ?? "Verification failed");
      } else if (json.verdict === "fail") {
        setVerifyError(json.reason ?? "Not verified — try another screenshot");
      } else {
        window.location.reload();
      }
    } catch {
      setVerifyError("Network error, try again");
    } finally {
      setIsVerifying(false);
    }
  }

  const isDone = doneToday;

  return (
    <motion.div
      layout
      className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 p-5"
      whileTap={{ scale: 0.98 }}
    >
      <AnimatePresence>
        {isDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ backgroundColor: color }}
          />
        )}
      </AnimatePresence>

      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji ?? "🎯"}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-medium text-white">{title}</h3>
              {mode === "PROOF" && (
                <span title="Proof required" className="text-xs text-neutral-500">
                  🛡️
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-1 text-sm text-neutral-400">
              <span>🔥</span>
              <motion.span key={streak} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                {streak}
              </motion.span>
            </div>
          </div>
        </div>

        {mode === "NORMAL" ? (
          <button
            onClick={handleNormalToggle}
            disabled={isPending}
            aria-label={isDone ? "Mark as not done" : "Mark as done"}
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 transition"
            style={{
              borderColor: color,
              backgroundColor: isDone ? color : "transparent",
            }}
          >
            <AnimatePresence>
              {isDone && (
                <motion.svg
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-white"
                  fill="none"
                >
                  <motion.path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.svg>
              )}
            </AnimatePresence>
          </button>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelected}
            />
            <button
              onClick={() => !isDone && fileInputRef.current?.click()}
              disabled={isVerifying || isDone}
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 transition disabled:opacity-60"
              style={{
                borderColor: color,
                backgroundColor: isDone ? color : "transparent",
              }}
              aria-label={isDone ? "Verified" : "Upload proof"}
            >
              {isDone ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : isVerifying ? (
                <span className="h-3 w-3 animate-pulse rounded-full bg-neutral-400" />
              ) : (
                <span className="text-sm">📷</span>
              )}
            </button>
          </>
        )}
      </div>

      <div className="relative mt-4 flex gap-1.5">
        {last7.map((done, i) => (
          <span
            key={i}
            className="h-1.5 flex-1 rounded-full"
            style={{ backgroundColor: done ? color : "rgba(255,255,255,0.08)" }}
          />
        ))}
      </div>

      {verifyError && <p className="relative mt-3 text-xs text-red-400">{verifyError}</p>}
    </motion.div>
  );
}
