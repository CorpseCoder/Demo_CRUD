import Link from "next/link";
import { headers } from "next/headers";
import {
  ArrowRight,
  CircleCheck,
  Gamepad2,
  Library,
  LogIn,
  Star,
  Timer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

const features = [
  {
    icon: Library,
    title: "Full backlog control",
    desc: "Add every game you own or want, in seconds.",
    accent: "text-sky-500 bg-sky-500/10",
  },
  {
    icon: CircleCheck,
    title: "Completion tracking",
    desc: "Status and completion percent for every game.",
    accent: "text-emerald-500 bg-emerald-500/10",
  },
  {
    icon: Star,
    title: "Ratings and reviews",
    desc: "Score games out of five and write your thoughts.",
    accent: "text-amber-500 bg-amber-500/10",
  },
  {
    icon: Timer,
    title: "Playtime and achievements",
    desc: "Log milestones and hours sunk into each game.",
    accent: "text-violet-500 bg-violet-500/10",
  },
] as const;

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-primary/15 to-transparent"
      />

      <span className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
        <Gamepad2 className="size-4 text-primary" />
        Your personal game tracker
      </span>

      <h1 className="mt-6 max-w-2xl bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl">
        Your game backlog, finally under control
      </h1>
      <p className="mt-5 max-w-xl text-balance text-lg text-muted-foreground">
        Track what you play across every platform: completion status, ratings,
        reviews, categories and playtime in one clean dashboard.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg" className="shadow-lg shadow-primary/25">
          <Link href={session ? "/games" : "/login?mode=signup"}>
            {session ? (
              <>
                Open my backlog <ArrowRight className="ml-1 size-4" />
              </>
            ) : (
              <>
                Get started - it&apos;s free <ArrowRight className="ml-1 size-4" />
              </>
            )}
          </Link>
        </Button>
        {!session && (
          <Button asChild variant="outline" size="lg">
            <Link href="/login">
              <LogIn className="mr-1 size-4" /> Sign in
            </Link>
          </Button>
        )}
      </div>

      <dl className="mt-16 grid w-full gap-4 text-left sm:grid-cols-2">
        {features.map(({ icon: Icon, title, desc, accent }) => (
          <div
            key={title}
            className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm transition hover:shadow-md"
          >
            <span
              className={`grid size-10 place-items-center rounded-lg ${accent}`}
            >
              <Icon className="size-5" />
            </span>
            <dt className="mt-3 font-semibold">{title}</dt>
            <dd className="mt-1 text-sm text-muted-foreground">{desc}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
