"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <a
          href="/"
          className="mx-auto mb-2 flex items-center justify-center gap-2 font-semibold tracking-tight"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-base font-black text-primary-foreground">
            B
          </span>
          Game Backlog
        </a>
        <CardTitle>
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </CardTitle>
        <CardDescription>
          {mode === "signin"
            ? "Sign in to your backlog"
            : "Start tracking your game collection"}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {(githubEnabled || googleEnabled) && (
          <>
            <div className="grid gap-2">
              {githubEnabled && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleSocial("github")}
                >
                  Continue with GitHub
                </Button>
              )}
              {googleEnabled && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleSocial("google")}
                >
                  Continue with Google
                </Button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase text-muted-foreground">
                <span className="bg-card px-2">or with email</span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="grid gap-3" noValidate>
          {mode === "signup" && (
            <div className="grid gap-2">
              <Label htmlFor="lf-name">Name</Label>
              <Input
                id="lf-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
                autoComplete="name"
                placeholder="Your name"
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="lf-email">Email</Label>
            <Input
              id="lf-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lf-password">Password</Label>
            <Input
              id="lf-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="Min 8 characters"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={pending}>
            {pending
              ? "Please wait..."
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "signin" ? "No account yet?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
