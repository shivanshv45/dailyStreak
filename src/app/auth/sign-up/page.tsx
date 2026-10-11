"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { saveTimezoneForCurrentUser } from "@/app/auth/actions";
import { AuthCard, AuthFrame, CodeForm, GoogleButton, OrDivider } from "../AuthFrame";

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "");
    const emailValue = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setError(null);
    setIsPending(true);
    try {
      const { error: signUpError } = await authClient.signUp.email({ name, email: emailValue, password });
      if (signUpError) {
        setError(signUpError.message ?? "Sign up failed");
        return;
      }
      setEmail(emailValue);
      setStep("verify");
    } finally {
      setIsPending(false);
    }
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    try {
      const { error: verifyError } = await authClient.emailOtp.verifyEmail({ email, otp: code });
      if (verifyError) {
        setError(verifyError.message ?? "Invalid code");
        return;
      }
      await saveTimezoneForCurrentUser(Intl.DateTimeFormat().resolvedOptions().timeZone);
      router.push("/");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  async function handleResend() {
    setError(null);
    await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
  }

  return (
    <AuthFrame>
      {step === "verify" ? (
        <AuthCard title="Check your inbox">
          <CodeForm email={email} code={code} setCode={setCode} error={error} isPending={isPending} onSubmit={handleVerify} onResend={handleResend} />
        </AuthCard>
      ) : (
        <AuthCard title="Start a streak">
          <GoogleButton onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/" })} />
          <OrDivider />
          <form onSubmit={handleSignUp} className="space-y-3">
            <input name="name" type="text" placeholder="Name" required autoComplete="name" className="input" />
            <input name="email" type="email" placeholder="Email" required autoComplete="email" className="input" />
            <input name="password" type="password" placeholder="Password (8+ characters)" required minLength={8} autoComplete="new-password" className="input" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={isPending} className="btn-ink mt-2 w-full py-3">
              {isPending ? "Creating…" : "Create account"}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-muted">
            Have an account?{" "}
            <Link href="/auth/sign-in" className="font-semibold text-ink underline decoration-pink decoration-2 underline-offset-4">
              Sign in
            </Link>
          </p>
        </AuthCard>
      )}
    </AuthFrame>
  );
}
