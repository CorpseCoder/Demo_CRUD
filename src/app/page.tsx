import Link from "next/link";
import { headers } from "next/headers";
import {
  ArrowRight,
  CircleCheck,
  Compass,
  Library,
  LogIn,
  Search,
  Settings,
  Star,
  Timer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

const showcaseGames = [
  { name: "Elden Ring", status: "Completed", gradient: "from-amber-400 to-yellow-700" },
  { name: "Baldur's Gate 3", status: "Playing", gradient: "from-rose-500 to-red-800" },
  { name: "Hades II", status: "Playing", gradient: "from-fuchsia-500 to-purple-800" },
  { name: "Cyberpunk 2077", status: "Backlog", gradient: "from-cyan-400 to-blue-700" },
  { name: "Stardew Valley", status: "Completed", gradient: "from-lime-400 to-green-700" },
  { name: "Hollow Knight", status: "Paused", gradient: "from-slate-500 to-zinc-800" },
] as const;

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

function IpadShowcase() {
  return (
    <div
      aria-hidden
      className="relative mx-auto mt-14 w-full max-w-3xl px-2 sm:px-0"
    >
      {/* Tablet bezel */}
      <div className="rounded-[2rem] border border-white/10 bg-zinc-900 p-2 shadow-2xl shadow-black/40 sm:p-3">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-background sm:rounded-[2rem]">
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-tr from-transparent via-white/5 to-white/10" />

          <div className="flex">
            {/* Sidebar */}
            <aside className="hidden flex-col items-center gap-5 border-r py-5 pl-4 pr-3 text-muted-foreground sm:flex">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="" className="size-7" />
              <Library className="size-4 text-primary" />
              <Compass className="size-4" />
              <Star className="size-4" />
              <Settings className="size-4 mt-auto" />
            </aside>

            {/* Screen content */}
            <div className="min-w-0 flex-1">
              <header className="flex items-center justify-between gap-3 p-3 sm:p-4">
                <span className="text-xs font-semibold tracking-tight sm:text-sm">
                  My Library
                </span>
                <div className="flex min-w-0 flex-1 justify-end sm:justify-center">
                  <span className="flex w-full max-w-56 items-center gap-2 rounded-full border bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
                    <Search className="size-3 shrink-0" />
                    <span className="truncate">Search your library...</span>
                  </span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/avatar.svg"
                  alt=""
                  className="size-6 shrink-0 rounded-full border sm:size-7"
                />
              </header>

              <div className="grid grid-cols-3 gap-2 p-3 pt-0 sm:gap-3 sm:p-4 sm:pt-0">
                {showcaseGames.map((g) => (
                  <div
                    key={g.name}
                    className={`group relative aspect-[3/4] overflow-hidden rounded-lg bg-gradient-to-br ${g.gradient} transition duration-300 hover:-translate-y-1 hover:shadow-xl`}
                  >
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6 sm:p-2.5 sm:pt-8">
                      <p className="text-[11px] font-bold leading-tight text-white sm:text-xs">
                        {g.name}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[9px] font-medium text-white/70 sm:text-[10px]">
                        <CircleCheck className="size-2.5 shrink-0" />
                        {g.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Home indicator */}
      <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-zinc-400/50" />
    </div>
  );
}

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <main className="relative mx-auto max-w-5xl overflow-hidden px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-primary/15 to-transparent"
      />

      <span className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" className="size-4" />
        Your personal game tracker
      </span>

      {/*
        Explicit leading + padding keeps descenders (g, y, p) visible:
        bg-clip-text clips at the line box, which cuts text at default leading.
      */}
      <h1 className="mx-auto mt-6 max-w-2xl bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text pb-2 text-4xl font-extrabold leading-[1.12] tracking-tight text-transparent sm:text-6xl sm:leading-[1.08]">
        Your game backlog, finally under control
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
        Track what you play across every platform: completion status, ratings,
        reviews, categories and playtime in one clean dashboard.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg" className="shadow-lg shadow-primary/25">
          <Link href={session ? "/games" : "/login?mode=signup"}>
            {session ? "Open my backlog" : "Get started - it's free"}
            <ArrowRight className="ml-1 size-4" />
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

      <IpadShowcase />

      <dl className="mt-16 grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-2">
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
