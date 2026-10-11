import { Logo } from "@/components/shell/Logo";
import { CheckCircleIcon } from "@/components/icons";
import { CloudEdge } from "@/components/Decor";
import { GoogleIcon } from "@/components/GoogleIcon";

const POINTS = ["Streaks for anything", "Proof mode, checked by AI", "Stats you can actually read"];

export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="grad-hero grain relative flex min-h-screen flex-col overflow-hidden">
      <header className="relative z-10 px-6 py-5 md:px-12">
        <Logo className="text-2xl" />
      </header>

      <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 pb-24 md:grid-cols-[1.1fr_1fr] md:px-12">
        <div className="hidden md:block">
          <h1 className="font-display text-6xl font-extrabold leading-[0.95] tracking-tight lg:text-7xl">
            Show up.
            <br />
            Every day.
          </h1>
          <ul className="mt-8 space-y-4">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-3 text-[17px]">
                <CheckCircleIcon className="h-7 w-7 shrink-0 stroke-[1.4]" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full max-w-md justify-self-center md:justify-self-end">{children}</div>
      </div>

      <CloudEdge />
    </main>
  );
}

export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-surface p-7 shadow-[0_20px_60px_rgba(80,30,80,0.18)] md:p-8">
      <h2 className="font-display text-3xl font-extrabold tracking-tight">{title}</h2>
      <div className="mt-6">{children}</div>
    </div>
  );
}

export function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2.5 rounded-full border border-line bg-surface py-2.5 text-sm font-semibold transition hover:border-line-strong hover:bg-canvas"
    >
      <GoogleIcon />
      Continue with Google
    </button>
  );
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-faint">
      <span className="h-px flex-1 bg-line" />
      or
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function CodeForm({
  email,
  code,
  setCode,
  error,
  isPending,
  onSubmit,
  onResend,
}: {
  email: string;
  code: string;
  setCode: (v: string) => void;
  error: string | null;
  isPending: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onResend?: () => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <p className="text-sm text-muted">
        Code sent to <span className="font-medium text-ink">{email}</span>
      </p>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="••••••"
        required
        maxLength={6}
        autoFocus
        className="input mt-4 text-center font-display text-3xl font-bold tracking-[0.5em]"
      />
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isPending || code.length < 6} className="btn-ink mt-5 w-full py-3">
        {isPending ? "Verifying…" : "Verify"}
      </button>
      {onResend && (
        <button type="button" onClick={onResend} className="mt-3 w-full text-sm text-muted hover:text-ink">
          Resend code
        </button>
      )}
    </form>
  );
}
