"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import GameForm from "@/components/GameForm";
import Modal from "@/components/Modal";
import Stars from "@/components/Stars";
import { createGame, deleteGame, toggleFavorite, updateGame } from "@/lib/actions";
import { signOut } from "@/lib/auth-client";
import {
  STATUS_LABELS,
  STATUS_VALUES,
  type Status,
} from "@/lib/validation";

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
  userId: string;
  createdAt: string;
  updatedAt: string;
};

type Sort = "recent" | "name" | "rating" | "playtime";

const STATUS_STYLES: Record<Status, string> = {
  backlog: "bg-zinc-800 text-zinc-300",
  playing: "bg-blue-950 text-blue-300",
  completed: "bg-emerald-950 text-emerald-300",
  paused: "bg-amber-950 text-amber-300",
  dropped: "bg-red-950 text-red-300",
};

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GameCardData | null>(null);
  const [deleting, setDeleting] = useState<GameCardData | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
      ["Completed", `${completed}${games.length ? ` (${Math.round((completed / games.length) * 100)}%)` : ""}`],
      ["Playing now", String(playing)],
      ["Total playtime", `${hours.toLocaleString()}h`],
    ] as const;
  }, [games]);

  function openAdd() {
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(g: GameCardData) {
    setEditing(g);
    setFormError(null);
    setFormOpen(true);
  }

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
        router.refresh();
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

  const chip =
    "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition border";
  const chipOn = "border-emerald-500 bg-emerald-500/10 text-emerald-300";
  const chipOff =
    "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-black text-zinc-950">
              B
            </span>
            Game Backlog
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-zinc-400 sm:block">
              {user.name || user.email}
            </span>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My backlog</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Track every game across platforms and statuses.
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
          >
            + Add game
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
            >
              <div className="text-xs font-medium text-zinc-500">{label}</div>
              <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`${chip} ${statusFilter === "all" ? chipOn : chipOff}`}
              onClick={() => setStatusFilter("all")}
            >
              All ({counts.all})
            </button>
            {STATUS_VALUES.map((s) => (
              <button
                key={s}
                type="button"
                className={`${chip} ${statusFilter === s ? chipOn : chipOff}`}
                onClick={() => setStatusFilter(s)}
              >
                {STATUS_LABELS[s]} ({counts[s]})
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search games..."
              aria-label="Search games"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 placeholder:text-zinc-600 lg:w-56"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Sort games"
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-2 text-sm outline-none focus:border-emerald-500"
            >
              {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
                <option key={s} value={s}>
                  {SORT_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 py-20 text-center">
            <div className="grid size-14 place-items-center rounded-2xl bg-zinc-900 text-2xl">
              🎮
            </div>
            <h3 className="mt-4 font-semibold">
              {games.length === 0
                ? "Your backlog is empty"
                : "No games match your filters"}
            </h3>
            <p className="mt-1 max-w-xs text-sm text-zinc-500">
              {games.length === 0
                ? "Add the first game to start tracking your collection."
                : "Try a different search or status filter."}
            </p>
            {games.length === 0 && (
              <button
                type="button"
                onClick={openAdd}
                className="mt-5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
              >
                Add your first game
              </button>
            )}
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((g) => (
              <li
                key={g.id}
                className="group relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold" title={g.name}>
                      {g.name}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {[g.platform, g.genre, g.releaseYear]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFavorite(g)}
                    disabled={pending}
                    aria-label={g.favorite ? "Unfavorite" : "Favorite"}
                    className={`shrink-0 text-lg leading-none transition ${
                      g.favorite ? "text-amber-400" : "text-zinc-700 hover:text-zinc-500"
                    }`}
                  >
                    ★
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLES[g.status]}`}
                  >
                    {STATUS_LABELS[g.status]}
                  </span>
                  {g.playtimeHours != null && (
                    <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-[11px] text-zinc-300">
                      {g.playtimeHours.toLocaleString()}h played
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <Stars value={g.rating} />
                </div>

                {g.achievements.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {g.achievements.slice(0, 3).map((a) => (
                      <span
                        key={a}
                        className="max-w-full truncate rounded-md bg-violet-950/60 px-2 py-0.5 text-[11px] text-violet-300"
                        title={a}
                      >
                        {a}
                      </span>
                    ))}
                    {g.achievements.length > 3 && (
                      <span className="rounded-md bg-violet-950/60 px-2 py-0.5 text-[11px] text-violet-300">
                        +{g.achievements.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {g.review && (
                  <p
                    className="mt-3 line-clamp-3 text-sm text-zinc-400"
                    title={g.review}
                  >
                    {g.review}
                  </p>
                )}

                <div className="mt-auto pt-4">
                  <div className="flex gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => openEdit(g)}
                      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(g)}
                      className="rounded-lg border border-red-900/70 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-950"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? "Edit game" : "Add game"}
        wide
      >
        <GameForm
          initial={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          error={formError}
          pending={pending}
        />
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete game"
      >
        <p className="text-sm text-zinc-400">
          Delete{" "}
          <span className="font-semibold text-zinc-200">{deleting?.name}</span>{" "}
          from your backlog? This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleting(null)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
          >
            {pending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
