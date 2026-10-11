"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { toggleCheckIn } from "@/app/tasks/actions";
import { compressImage } from "@/lib/compressImage";
import { cadenceLabel, cadenceNoun, cadenceScope, type Cadence } from "@/lib/frequency";
import { Art } from "@/components/Art";
import { RemoveTaskDialog } from "@/components/RemoveTaskDialog";

export type TaskCardProps = {
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
  color: string;
  mode: "NORMAL" | "PROOF";
  cadence: Cadence;
  streak: number;
  doneToday: boolean;
  last7: boolean[];
  checkInCount: number;
  /** e.g. "Due Fri 16 Oct" for tasks that aren't due today */
  note?: string | null;
};

const TILTS = [-1.6, 1.1, -0.8, 1.5];
function tiltFor(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return TILTS[h % TILTS.length];
}

export function TaskCard({ id, title, description, emoji, color, mode, cadence, streak, doneToday, last7, checkInCount, note }: TaskCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticDone, setOptimisticDone] = useState<boolean | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [removing, setRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDone = optimisticDone ?? doneToday;
  const shownStreak = optimisticDone === null || optimisticDone === doneToday ? streak : optimisticDone ? streak + 1 : Math.max(0, streak - 1);
  const isProof = mode === "PROOF";
  const scope = cadenceScope(cadence);
  const paper = `color-mix(in srgb, ${color} 20%, #fffdf7)`;

  function handleToggle() {
    if (isPending) return;
    const next = !isDone;
    setOptimisticDone(next);
    if (next) setBurstKey((k) => k + 1);
    startTransition(async () => {
      try {
        await toggleCheckIn(id);
      } catch {
        setOptimisticDone(null);
      }
    });
  }

  async function submitProof(file: File) {
    if (!file.type.startsWith("image/") || isDone || isVerifying) return;
    setIsVerifying(true);
    setVerifyError(null);

    try {
      const image = await compressImage(file);
      const body = new FormData();
      body.set("taskId", id);
      body.set("image", image, "proof.jpg");

      const res = await fetch("/api/verify", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setVerifyError(json.error ?? "Verification failed");
      } else if (json.verdict === "fail") {
        setVerifyError(json.reason || "Not accepted — try another screenshot");
      } else {
        setOptimisticDone(true);
        setBurstKey((k) => k + 1);
        router.refresh();
      }
    } catch {
      setVerifyError("Something went wrong, try again");
    } finally {
      setIsVerifying(false);
    }
  }

  function handleButtonClick() {
    if (!isProof) return handleToggle();
    if (!isDone && !isVerifying) fileInputRef.current?.click();
  }

  const buttonLabel = isDone
    ? isProof
      ? "Verified"
      : `Done · ${scope.toLowerCase()}`
    : isProof
      ? isVerifying
        ? "Checking proof…"
        : "Add proof"
      : "Mark done";

  return (
    <motion.article
      id={`t-${id}`}
      layout
      tabIndex={isProof ? 0 : undefined}
      onPaste={(e) => {
        const file = isProof ? e.clipboardData.files?.[0] : undefined;
        if (file) submitProof(file);
      }}
      onDragOver={(e) => {
        if (!isProof || isDone) return;
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        if (!isProof) return;
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) submitProof(file);
      }}
      className="group scroll-mt-24 outline-none"
    >
      <div
        className={`paper-shadow grain relative rotate-[var(--tilt)] rounded-[5px] p-5 pt-6 group-hover:-translate-y-1 group-hover:rotate-0 ${isDragging ? "ring-2 ring-pink ring-offset-4" : ""}`}
        style={{ background: paper, "--tilt": `${tiltFor(id)}deg` } as React.CSSProperties}
      >
        <span className="tape" style={{ background: `color-mix(in srgb, ${color} 55%, white)` }} aria-hidden />

        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-1">
            <span className="rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">{cadenceLabel(cadence)}</span>
            {isProof && <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Proof</span>}
            {note && <span className="rounded-full border border-ink/40 bg-transparent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">{note}</span>}
          </div>
          <div className="-mr-2 -mt-1 flex shrink-0 items-start gap-0.5">
            {emoji && (
              <span className="inline-flex h-10 w-10 rotate-6 items-center justify-center rounded-full bg-white text-lg shadow-sm">{emoji}</span>
            )}
            <button
              type="button"
              onClick={() => setRemoving(true)}
              aria-label={`Options for ${title}`}
              className="rounded-lg px-1.5 py-1 font-display text-lg font-extrabold leading-none tracking-widest text-ink/60 transition hover:bg-white/70 hover:text-ink"
            >
              ···
            </button>
          </div>
        </div>

        <h3 className="mt-3 line-clamp-2 font-hand text-[2.125rem] font-bold leading-[1.02] text-ink/90">{title}</h3>
        {description && <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-ink/80">{description}</p>}

        <div className="mt-5 border-t border-dashed border-ink/20 pt-4">
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-center gap-2">
              <Art src="/icons/streak.png" size={34} />
              <div>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.p
                    key={shownStreak}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -12, opacity: 0 }}
                    className="font-display text-[2.5rem] font-extrabold leading-[0.9] tabular-nums"
                  >
                    {shownStreak}
                  </motion.p>
                </AnimatePresence>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-ink/70">{cadenceNoun(cadence, 1)} streak</p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-[5px]" aria-label={`Last 7 ${cadenceNoun(cadence, 7)}`}>
                {last7.map((done, i) => {
                  const isCurrent = i === last7.length - 1;
                  const filled = isCurrent ? isDone : done;
                  return (
                    <span
                      key={i}
                      className={`rounded-full border-[1.5px] border-ink/70 transition-colors ${isCurrent ? "h-[0.875rem] w-[0.875rem]" : "h-[0.6875rem] w-[0.6875rem]"}`}
                      style={{ backgroundColor: filled ? color : "rgba(255,255,255,0.75)" }}
                    />
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-ink/70">last 7 {cadenceNoun(cadence, 7)}</p>
            </div>
          </div>
        </div>

        {isProof && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) submitProof(file);
            }}
          />
        )}

        <motion.button
          type="button"
          onClick={handleButtonClick}
          disabled={isVerifying || (isProof && isDone)}
          whileTap={{ scale: 0.97 }}
          aria-pressed={isDone}
          className={`relative mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors disabled:cursor-default ${
            isDone ? "bg-ink text-white" : "border-2 border-ink bg-white/85 text-ink hover:bg-white"
          }`}
        >
          {isDone && <DrawnCheck color={color} />}
          {!isDone && isProof && !isVerifying && <Art src="/icons/proof.png" size={20} />}
          {isVerifying && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
          {buttonLabel}
          <Burst key={burstKey} color={color} active={burstKey > 0} />
        </motion.button>

        {verifyError && <p className="mt-3 rounded-md bg-white/80 px-3 py-2 text-xs text-ink/80">{verifyError}</p>}
      </div>

      {removing && <RemoveTaskDialog taskId={id} title={title} checkInCount={checkInCount} allowArchive onClose={() => setRemoving(false)} />}
    </motion.article>
  );
}

function DrawnCheck({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <motion.path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3 }}
      />
    </svg>
  );
}

function Burst({ color, active }: { color: string; active: boolean }) {
  if (!active) return null;
  const pieces = Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2);
  return (
    <span className="pointer-events-none absolute left-1/2 top-1/2">
      {pieces.map((angle, i) => (
        <motion.span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-[2px]"
          style={{ backgroundColor: i % 3 === 0 ? "var(--orange)" : i % 3 === 1 ? "white" : color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: Math.cos(angle) * 70, y: Math.sin(angle) * 22, opacity: 0, scale: 0.4, rotate: 120 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        />
      ))}
    </span>
  );
}
