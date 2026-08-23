import Link from "next/link";
import { headers } from "next/headers";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

const features = [
  ["Full backlog control", "Add every game you own or want, in seconds."],
  ["Completion status", "Backlog, playing, completed, paused or dropped."],
  ["Ratings and reviews", "Score games out of five and write your thoughts."],
  ["Achievements and playtime", "Log milestones and hours sunk into each game."],
];

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-20 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-primary text-2xl font-black text-primary-foreground">
        B
      </span>
      <h1 className="mt-6 max-w-2xl bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl">
        Your game backlog, finally under control
      </h1>
      <p className="mt-5 max-w-xl text-balance text-lg text-zinc-400">
        Track what you play across every platform: completion status, ratings,
        reviews, achievements and playtime in one clean dashboard.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href={session ? "/games" : "/login?mode=signup"}>
            {session ? "Open my backlog" : "Get started - it's free"}
          </Link>
        </Button>
        {!session && (
          <Button asChild variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
        )}
      </div>

      <dl className="mt-16 grid w-full gap-4 text-left sm:grid-cols-2">
        {features.map(([title, desc]) => (
          <div
            key={title}
            className="rounded-2xl border bg-card p-5 text-card-foreground"
          >
            <dt className="font-semibold">{title}</dt>
            <dd className="mt-1 text-sm text-muted-foreground">{desc}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
