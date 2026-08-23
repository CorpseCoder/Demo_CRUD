"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Activity,
  Clock3,
  Gamepad2,
  LogOut,
  Moon,
  Star,
  Sun,
} from "lucide-react";

import GameForm from "@/components/GameForm";
import Stars from "@/components/Stars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createGame, deleteGame, toggleFavorite, updateGame } from "@/lib/actions";
import { signOut } from "@/lib/auth-client";
import { STATUS_LABELS, STATUS_VALUES, type Status } from "@/lib/validation";

export type GameCardData = {
  id: string;
  name: string;
  platform: string;
  status: Status;
  rating: number | null;
  review: string | null;
  achievements: string[];
  playtimeHours: number | null;
  coverUrl: string | null;
  notes: string | null;
  favorite: boolean;
  releaseYear: number | null;
  genre: string | null;
  category: string | null;
  completedPercent: number | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

type Sort = "recent" | "name" | "rating" | "playtime";

const STATUS_BADGE: Record<Status, string> = {
  backlog: "bg-secondary text-secondary-foreground",
  playing: "bg-blue-950 text-blue-300",
  completed: "bg-emerald-950 text-emerald-300",
  paused: "bg-amber-950 text-amber-300",
  dropped: "bg-red-950 text-red-300",
};

// Tag colour ramps up with hours played.
function HOURS_BADGE(hours: number | null): string {
  if (hours == null) return "bg-secondary text-secondary-foreground";
  if (hours >= 100) return "bg-rose-950 text-rose-300";
  if (hours >= 50) return "bg-amber-950 text-amber-300";
  if (hours >= 20) return "bg-sky-950 text-sky-300";
  return "bg-emerald-950 text-emerald-300";
}

const SORT_LABELS: Record<Sort, string> = {
  recent: "Recently added",
  name: "Name A-Z",
  rating: "Highest rated",
  playtime: "Most played",
};

export default function Dashboard({
  user,
  initialGames,
}: {
  user: { name: string; email: string };
  initialGames: GameCardData[];
}) {
  const router = useRouter();
  const [games, setGames] = useState(initialGames);
  const [live, setLive] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GameCardData | null>(null);
  const [deleting, setDeleting] = useState<GameCardData | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Adopt fresh server data whenever the RSC payload changes (e.g. live refresh).
  useEffect(() => {
    setGames(initialGames);
  }, [initialGames]);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  // Live mode: poll the server for fresh data every 8 seconds.
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(id);
  }, [live, router]);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: games.length };
    for (const s of STATUS_VALUES) c[s] = 0;
    for (const g of games) c[g.status]++;
    return c;
  }, [games]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = games.filter((g) => {
      if (statusFilter !== "all" && g.status !== statusFilter) return false;
      if (!q) return true;
      return (
        g.name.toLowerCase().includes(q) ||
        g.platform.toLowerCase().includes(q) ||
        (g.genre ?? "").toLowerCase().includes(q) ||
        (g.category ?? "").toLowerCase().includes(q) ||
        (g.review ?? "").toLowerCase().includes(q)
      );
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "rating":
          return (b.rating ?? -1) - (a.rating ?? -1);
        case "playtime":
          return (b.playtimeHours ?? -1) - (a.playtimeHours ?? -1);
        default:
          return b.createdAt.localeCompare(a.createdAt);
      }
    });
    return list;
  }, [games, search, statusFilter, sort]);

  const stats = useMemo(() => {
    const hours = games.reduce((sum, g) => sum + (g.playtimeHours ?? 0), 0);
    const completed = games.filter((g) => g.status === "completed").length;
    const playing = games.filter((g) => g.status === "playing").length;
    return [
      ["Total games", String(games.length)],
      [
        "Completed",
        `${completed}${games.length ? ` (${Math.round((completed / games.length) * 100)}%)` : ""}`,
      ],
      ["Playing now", String(playing)],
      ["Total playtime", `${hours.toLocaleString()}h`],
    ] as const;
  }, [games]);

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function handleSubmit(data: Record<string, unknown>) {
    setFormError(null);
    startTransition(async () => {
      if (editing) {
        const res = await updateGame(editing.id, data as never);
        if (!res.ok) {
          setFormError(res.error ?? "Could not save.");
          return;
        }
        setGames((prev) =>
          prev.map((g) =>
            g.id === editing.id
              ? { ...g, ...(data as object), updatedAt: new Date().toISOString() }
              : g,
          ),
        );
      } else {
        const res = await createGame(data as never);
        if (!res.ok) {
          setFormError(res.error ?? "Could not save.");
          return;
        }
      }
      router.refresh();
      closeForm();
    });
  }

  function handleDelete() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      const res = await deleteGame(target.id);
      if (res.ok) {
        setGames((prev) => prev.filter((g) => g.id !== target.id));
        router.refresh();
      }
      setDeleting(null);
    });
  }

  function handleFavorite(g: GameCardData) {
    startTransition(async () => {
      const res = await toggleFavorite(g.id);
      if (res.ok) {
        setGames((prev) =>
          prev.map((x) => (x.id === g.id ? { ...x, favorite: !x.favorite } : x)),
        );
        router.refresh();
      }
    });
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6">
          <a href="/games" className="flex min-w-0 items-center gap-2 font-semibold tracking-tight">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Game Backlog logo" className="size-8 shrink-0" />
            <span className="truncate">Game Backlog</span>
          </a>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              variant={live ? "default" : "outline"}
              onClick={() => setLive((v) => !v)}
              aria-pressed={live}
              title={live ? "Live updates on (refreshes every 8s)" : "Enable live updates"}
            >
              <Activity className="size-4" />
              <span className="hidden sm:inline">Live</span>
              {live && (
                <span
                  aria-hidden
                  className="ml-0.5 inline-block size-1.5 animate-pulse rounded-full bg-current"
                />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border py-1 pl-1 pr-1.5 transition hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:pr-3"
                  aria-label="Open profile menu"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/avatar.svg"
                    alt=""
                    className="size-7 shrink-0 rounded-full border sm:size-8"
                  />
                  <span className="hidden max-w-36 truncate text-sm font-medium sm:block">
                    {user.name || user.email}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleTheme}>
                  {isDark ? <Sun /> : <Moon />}
                  {isDark ? "Light mode" : "Dark mode"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => void handleSignOut()}>
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My backlog</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track every game across platforms and statuses.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setFormError(null);
              setFormOpen(true);
            }}
          >
            Add game
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border bg-card p-4 text-card-foreground"
            >
              <div className="text-xs font-medium text-muted-foreground">{label}</div>
              <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={statusFilter === "all" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setStatusFilter("all")}
            >
              All ({counts.all})
            </Button>
            {STATUS_VALUES.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setStatusFilter(s)}
              >
                {STATUS_LABELS[s]} ({counts[s]})
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search games..."
              aria-label="Search games"
              className="w-full lg:w-56"
            />
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="w-[160px]" aria-label="Sort games">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {SORT_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
            <h3 className="font-semibold">
              {games.length === 0
                ? "Your backlog is empty"
                : "No games match your filters"}
            </h3>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              {games.length === 0
                ? "Add the first game to start tracking your collection."
                : "Try a different search or status filter."}
            </p>
            {games.length === 0 && (
              <Button
                className="mt-5"
                onClick={() => {
                  setEditing(null);
                  setFormError(null);
                  setFormOpen(true);
                }}
              >
                Add your first game
              </Button>
            )}
          </div>
        ) : (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((g) => (
              <li
                key={g.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <button
                  type="button"
                  onClick={() => handleFavorite(g)}
                  disabled={pending}
                  aria-label={g.favorite ? "Unfavorite" : "Favorite"}
                  className={`absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full backdrop-blur transition ${
                    g.favorite
                      ? "bg-background/70 text-amber-400"
                      : "bg-background/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Star className="size-4" fill={g.favorite ? "currentColor" : "none"} />
                </button>

                <div className="relative h-56 w-full shrink-0 overflow-hidden bg-muted">
                  {g.coverUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={g.coverUrl}
                      alt=""
                      className="h-full w-full object-cover drop-shadow-lg transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-muted to-secondary/60">
                      <Gamepad2 className="size-16 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
                </div>

                <div className="flex flex-1 flex-col justify-end gap-3 p-5">
                  <div>
                    <h3 className="truncate text-lg font-bold tracking-tight" title={g.name}>
                      {g.name}
                    </h3>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {[g.platform, g.releaseYear].filter(Boolean).join(" · ")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`${STATUS_BADGE[g.status]} border-transparent`}>
                      {STATUS_LABELS[g.status]}
                    </Badge>
                    {g.playtimeHours != null && (
                      <Badge className={`${HOURS_BADGE(g.playtimeHours)} border-transparent`}>
                        <Clock3 className="mr-1 size-3" />
                        {g.playtimeHours.toLocaleString()}h played
                      </Badge>
                    )}
                    {g.category && (
                      <Badge variant="outline" title={`Category: ${g.category}`}>
                        {g.category}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <Stars value={g.rating} />
                    {(g.genre || g.completedPercent != null) && (
                      <span className="truncate text-xs text-muted-foreground">
                        {[g.genre, g.completedPercent != null ? `${g.completedPercent}% done` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </div>

                  {g.completedPercent != null && (
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-secondary"
                      role="progressbar"
                      aria-valuenow={g.completedPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${g.name} completion`}
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${g.completedPercent}%` }}
                      />
                    </div>
                  )}

                  {g.review && (
                    <p
                      className="line-clamp-3 text-sm leading-relaxed text-muted-foreground"
                      title={g.review}
                    >
                      {g.review}
                    </p>
                  )}

                  <div className="flex gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(g);
                        setFormError(null);
                        setFormOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleting(g)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Dialog open={formOpen} onOpenChange={(o) => !o && closeForm()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit game" : "Add game"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the details of this game."
                : "Add a game to your backlog."}
            </DialogDescription>
          </DialogHeader>
          <GameForm
            initial={editing ?? undefined}
            onSubmit={handleSubmit}
            onCancel={closeForm}
            error={formError}
            pending={pending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete game</DialogTitle>
            <DialogDescription>
              Delete{" "}
              <span className="font-semibold text-foreground">{deleting?.name}</span>{" "}
              from your backlog? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending}>
              {pending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
