"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { saveTimezoneForCurrentUser } from "@/app/auth/actions";
import { AuthCard, AuthFrame, CodeForm, GoogleButton, OrDivider } from "../AuthFrame";

export default function SignInPage() {
  const router = useRouter();
  const [needsVerification, setNeedsVerification] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const emailValue = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setError(null);
    setIsPending(true);
    try {
      const { error: signInError } = await authClient.signIn.email({ email: emailValue, password });
      if (signInError) {
        if (signInError.code === "EMAIL_NOT_VERIFIED") {
          setEmail(emailValue);
          await authClient.emailOtp.sendVerificationOtp({ email: emailValue, type: "email-verification" });
          setNeedsVerification(true);
        } else {
          setError(signInError.message ?? "Sign in failed");
        }
        return;
      }
      router.push("/");
      router.refresh();
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

  return (
    <AuthFrame>
      {needsVerification ? (
        <AuthCard title="Verify your email">
          <CodeForm
            email={email}
            code={code}
            setCode={setCode}
            error={error}
            isPending={isPending}
            onSubmit={handleVerify}
            onResend={() => authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" })}
          />
        </AuthCard>
      ) : (
        <AuthCard title="Welcome back">
          <GoogleButton onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/" })} />
          <OrDivider />
          <form onSubmit={handleSignIn} className="space-y-3">
            <input name="email" type="email" placeholder="Email" required autoComplete="email" className="input" />
            <input name="password" type="password" placeholder="Password" required autoComplete="current-password" className="input" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={isPending} className="btn-ink mt-2 w-full py-3">
              {isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-muted">
            New here?{" "}
            <Link href="/auth/sign-up" className="font-semibold text-ink underline decoration-pink decoration-2 underline-offset-4">
              Create an account
            </Link>
          </p>
        </AuthCard>
      )}
    </AuthFrame>
  );
}
