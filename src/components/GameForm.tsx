"use client";

import { useEffect, useState } from "react";

import Stars from "@/components/Stars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PLATFORMS,
  STATUS_LABELS,
  STATUS_VALUES,
  gameInputSchema,
  type Status,
} from "@/lib/validation";

type Candidate = {
  id: number;
  name: string;
  image: string;
  released: string | null;
  genres: string[];
};

type FieldErrors = Partial<Record<string, string>>;

function toIntOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
}

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
  const [category, setCategory] = useState(initial?.category ?? "");
  const [completedPercent, setCompletedPercent] = useState(
    initial?.completedPercent != null ? String(initial.completedPercent) : "",
  );
  const [releaseYear, setReleaseYear] = useState(
    initial?.releaseYear != null ? String(initial.releaseYear) : "",
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchConfigured, setSearchConfigured] = useState(true);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(
    initial?.coverUrl ?? null,
  );

  useEffect(() => {
    const q = name.trim();
    if (q.length < 3) {
      setCandidates([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await fetch(`/api/games/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSearchConfigured(data.configured !== false);
        setCandidates(Array.isArray(data.results) ? data.results : []);
      } catch {
        setCandidates([]);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [name]);

  function clearError(key: string) {
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }

  function pickCandidate(c: Candidate) {
    setSelectedUrl(c.image);
    if (!releaseYear && c.released) {
      const y = Number(c.released.slice(0, 4));
      if (!Number.isNaN(y)) setReleaseYear(String(y));
    }
    if (!genre.trim() && c.genres.length > 0) setGenre(c.genres[0]);
    if (!category.trim() && c.genres.length > 0) setCategory(c.genres[0]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name,
      platform,
      status,
      rating,
      playtimeHours: toIntOrNull(playtime),
      achievements: achievementsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      review: review.trim() === "" ? null : review.trim(),
      coverUrl: selectedUrl,
      notes: null,
      favorite: false,
      genre: genre.trim() === "" ? null : genre.trim(),
      category: category.trim() === "" ? null : category.trim(),
      completedPercent: toIntOrNull(completedPercent),
      releaseYear: toIntOrNull(releaseYear),
    };

    // Client-side validation mirrors the server schema; errors show inline.
    const parsed = gameInputSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    onSubmit(payload);
  }

  function fieldError(key: string) {
    const msg = fieldErrors[key];
    return msg ? (
      <p className="text-xs font-medium text-destructive">{msg}</p>
    ) : null;
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      <div className="grid gap-2">
        <Label htmlFor="gf-name">Game name *</Label>
        <Input
          id="gf-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearError("name");
          }}
          placeholder="e.g. Elden Ring"
          required
          maxLength={140}
          aria-invalid={!!fieldErrors.name}
          autoFocus
        />
        {fieldError("name")}
      </div>

      {searchConfigured && (
        <div className="grid gap-2">
          <span className="text-sm text-muted-foreground">
            Cover art{" "}
            <span className="text-muted-foreground/60">
              {searching
                ? "- searching..."
                : candidates.length > 0
                  ? "- click one to use it"
                  : name.trim().length >= 3
                    ? "- no matches found"
                    : "(type a name to search online)"}
            </span>
          </span>
          {candidates.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {candidates.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickCandidate(c)}
                  title={c.name}
                  className={`shrink-0 overflow-hidden rounded-md border-2 transition ${
                    selectedUrl === c.image
                      ? "border-primary"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.image}
                    alt={c.name}
                    className="h-24 w-16 object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="gf-platform">Platform *</Label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger id="gf-platform" className="w-full">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              {PLATFORMS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="gf-status">Completion status *</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as Status)}
          >
            <SelectTrigger id="gf-status" className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_VALUES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>Rating</Label>
          <div className="flex h-9 items-center">
            <Stars value={rating} onChange={setRating} />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="gf-playtime">Playtime (hours)</Label>
          <Input
            id="gf-playtime"
            type="number"
            min={0}
            max={100000}
            step={1}
            value={playtime}
            onChange={(e) => {
              setPlaytime(e.target.value);
              clearError("playtimeHours");
            }}
            placeholder="0"
            aria-invalid={!!fieldErrors.playtimeHours}
          />
          {fieldError("playtimeHours")}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="gf-category">Category</Label>
          <Input
            id="gf-category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              clearError("category");
            }}
            placeholder="e.g. Open world"
            maxLength={60}
            aria-invalid={!!fieldErrors.category}
          />
          {fieldError("category")}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="gf-completion">Completed (%)</Label>
          <Input
            id="gf-completion"
            type="number"
            min={0}
            max={100}
            step={1}
            value={completedPercent}
            onChange={(e) => {
              setCompletedPercent(e.target.value);
              clearError("completedPercent");
            }}
            placeholder="0-100"
            aria-invalid={!!fieldErrors.completedPercent}
          />
          {fieldError("completedPercent")}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="gf-genre">Genre</Label>
          <Input
            id="gf-genre"
            value={genre}
            onChange={(e) => {
              setGenre(e.target.value);
              clearError("genre");
            }}
            placeholder="RPG"
            maxLength={60}
            aria-invalid={!!fieldErrors.genre}
          />
          {fieldError("genre")}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="gf-year">Release year</Label>
          <Input
            id="gf-year"
            type="number"
            min={1950}
            max={2100}
            step={1}
            value={releaseYear}
            onChange={(e) => {
              setReleaseYear(e.target.value);
              clearError("releaseYear");
            }}
            placeholder="2024"
            aria-invalid={!!fieldErrors.releaseYear}
          />
          {fieldError("releaseYear")}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="gf-achievements">
          Achievements <span className="text-muted-foreground">(one per line)</span>
        </Label>
        <Textarea
          id="gf-achievements"
          rows={3}
          value={achievementsText}
          onChange={(e) => {
            setAchievementsText(e.target.value);
            clearError("achievements");
          }}
          placeholder={"First steps\nBeat the final boss\n100% completion"}
          maxLength={4200}
          aria-invalid={!!fieldErrors.achievements}
        />
        {fieldError("achievements")}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="gf-review">Review</Label>
        <Textarea
          id="gf-review"
          rows={4}
          value={review}
          onChange={(e) => {
            setReview(e.target.value);
            clearError("review");
          }}
          placeholder="Your thoughts on the game..."
          maxLength={2000}
          aria-invalid={!!fieldErrors.review}
        />
        {fieldError("review")}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="mt-1 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending || name.trim() === ""}>
          {pending
            ? "Saving..."
            : initial
              ? "Save changes"
              : "Add game"}
        </Button>
      </div>
    </form>
  );
}
