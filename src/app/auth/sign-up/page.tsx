"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signUp } from "../actions";

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
    setError(null);
    startTransition(async () => {
      const result = await signUp(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <form
        action={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl"
      >
        <h1 className="mb-6 text-2xl font-semibold text-white">Create account</h1>

        <div className="space-y-4">
          <input
            name="name"
            type="text"
            placeholder="Name"
            required
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white placeholder-neutral-500 outline-none focus:border-indigo-500"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white placeholder-neutral-500 outline-none focus:border-indigo-500"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            minLength={8}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-white placeholder-neutral-500 outline-none focus:border-indigo-500"
          />
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="mt-6 w-full rounded-lg bg-indigo-500 py-2.5 font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Sign up"}
        </button>

        <p className="mt-4 text-center text-sm text-neutral-400">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-indigo-400 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
