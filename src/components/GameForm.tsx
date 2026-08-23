"use client";

import { useState } from "react";

import Stars from "@/components/Stars";
import {
  PLATFORMS,
  STATUS_LABELS,
  STATUS_VALUES,
  type Status,
} from "@/lib/validation";

export default function GameForm({
  initial,
  onSubmit,
  onCancel,
  error,
  pending,
}: {
  initial?: import("@/components/Dashboard").GameCardData;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  error: string | null;
  pending: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [platform, setPlatform] = useState(initial?.platform ?? PLATFORMS[0]);
  const [status, setStatus] = useState<Status>(initial?.status ?? "backlog");
  const [rating, setRating] = useState<number | null>(initial?.rating ?? null);
  const [playtime, setPlaytime] = useState(
    initial?.playtimeHours != null ? String(initial.playtimeHours) : "",
  );
  const [achievementsText, setAchievementsText] = useState(
    (initial?.achievements ?? []).join("\n"),
  );
  const [review, setReview] = useState(initial?.review ?? "");
  const [genre, setGenre] = useState(initial?.genre ?? "");
  const [releaseYear, setReleaseYear] = useState(
    initial?.releaseYear != null ? String(initial.releaseYear) : "",
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name,
      platform,
      status,
      rating,
      playtimeHours: playtime === "" ? null : Number(playtime),
      achievements: achievementsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      review: review.trim() === "" ? null : review.trim(),
      coverUrl: null,
      notes: null,
      favorite: false,
      genre: genre.trim() === "" ? null : genre.trim(),
      releaseYear:
        releaseYear === "" ? null : Number(releaseYear),
    });
  }

  const label = "mb-1.5 block text-xs font-medium text-zinc-400";
  const input =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-zinc-600";

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      <div>
        <label className={label} htmlFor="gf-name">
          Game name *
        </label>
        <input
          id="gf-name"
          className={input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Elden Ring"
          required
          maxLength={140}
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label} htmlFor="gf-platform">
            Platform *
          </label>
          <select
            id="gf-platform"
            className={input}
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="gf-status">
            Completion status *
          </label>
          <select
            id="gf-status"
            className={input}
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
          >
            {STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className={label}>Rating</span>
          <div className="flex h-[38px] items-center">
            <Stars value={rating} onChange={setRating} />
          </div>
        </div>
        <div>
          <label className={label} htmlFor="gf-playtime">
            Playtime (hours)
          </label>
          <input
            id="gf-playtime"
            className={input}
            type="number"
            min={0}
            max={100000}
            value={playtime}
            onChange={(e) => setPlaytime(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label} htmlFor="gf-genre">
            Genre
          </label>
          <input
            id="gf-genre"
            className={input}
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="RPG"
            maxLength={60}
          />
        </div>
        <div>
          <label className={label} htmlFor="gf-year">
            Release year
          </label>
          <input
            id="gf-year"
            className={input}
            type="number"
            min={1950}
            max={2100}
            value={releaseYear}
            onChange={(e) => setReleaseYear(e.target.value)}
            placeholder="2024"
          />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="gf-achievements">
          Achievements{" "}
          <span className="text-zinc-600">(one per line)</span>
        </label>
        <textarea
          id="gf-achievements"
          className={`${input} min-h-20 resize-y`}
          value={achievementsText}
          onChange={(e) => setAchievementsText(e.target.value)}
          placeholder={"First steps\nBeat the final boss\n100% completion"}
          maxLength={4200}
        />
      </div>

      <div>
        <label className={label} htmlFor="gf-review">
          Review
        </label>
        <textarea
          id="gf-review"
          className={`${input} min-h-24 resize-y`}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Your thoughts on the game..."
          maxLength={2000}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-950/60 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}

      <div className="mt-1 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending || name.trim() === ""}
          className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {pending ? "Saving..." : initial ? "Save changes" : "Add game"}
        </button>
      </div>
    </form>
  );
}
