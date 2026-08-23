"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { signIn, signUp } from "@/lib/auth-client";

type Mode = "signin" | "signup";

export default function LoginForm({
  defaultMode,
  githubEnabled,
  googleEnabled,
}: {
  defaultMode: Mode;
  githubEnabled: boolean;
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function afterAuth() {
    router.push("/games");
    router.refresh();
  }

  async function handleSocial(provider: "github" | "google") {
    setError(null);
    await signIn.social({ provider, callbackURL: "/games" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "signup") {
          const res = await signUp.email({ name, email, password });
          if (res.error) {
            setError(res.error.message ?? "Could not create account.");
            return;
          }
          afterAuth();
          return;
        }
        const res = await signIn.email({ email, password });
        if (res.error) {
          setError(res.error.message ?? "Invalid email or password.");
          return;
        }
        afterAuth();
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  const inputCls =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-zinc-600";

  return (
    <div className="w-full max-w-sm">
      <a
        href="/"
        className="mb-8 flex items-center justify-center gap-2 text-lg font-semibold tracking-tight"
      >
        <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 font-bold text-zinc-950">
          B
        </span>
        Game Backlog
      </a>

      {githubEnabled || googleEnabled ? (
        <>
          <div className="grid gap-2">
            {githubEnabled && (
              <button
                type="button"
                onClick={() => void handleSocial("github")}
                className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium transition hover:bg-zinc-800"
              >
                Continue with GitHub
              </button>
            )}
            {googleEnabled && (
              <button
                type="button"
                onClick={() => void handleSocial("google")}
                className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium transition hover:bg-zinc-800"
              >
                Continue with Google
              </button>
            )}
          </div>
          <div className="my-6 flex items-center gap-3 text-xs text-zinc-500">
            <span className="h-px flex-1 bg-zinc-800" />
            or with email
            <span className="h-px flex-1 bg-zinc-800" />
          </div>
        </>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-3" noValidate>
        {mode === "signup" && (
          <input
            className={inputCls}
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            autoComplete="name"
          />
        )}
        <input
          className={inputCls}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          className={inputCls}
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />

        {error && (
          <p className="rounded-lg bg-red-950/60 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {pending
            ? "Please wait..."
            : mode === "signup"
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        {mode === "signin" ? "No account yet?" : "Already have an account?"}{" "}
        <button
          type="button"
          className="font-medium text-emerald-400 hover:underline"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
