"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CalendarDays,
  Clock3,
  ExternalLink,
  Gamepad2,
  Globe,
  Loader2,
  Star,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

type Game = import("@/components/Dashboard").GameCardData;

type RawgDetails = {
  found: boolean;
  configured?: boolean;
  name?: string;
  description?: string | null;
  metacritic?: number | null;
  rating?: number | null;
  ratingsCount?: number | null;
  released?: string | null;
  avgPlaytime?: number | null;
  website?: string | null;
  backgroundImage?: string | null;
  developers?: string[];
  publishers?: string[];
  genres?: string[];
  platforms?: string[];
  esrb?: string | null;
  ratingsBreakdown?: { title: string; percent: number; count: number }[];
};

const BREAKDOWN_STYLES: Record<string, { fill: string; label: string }> = {
  exceptional: { fill: "bg-emerald-500", label: "Exceptional" },
  recommended: { fill: "bg-sky-500", label: "Recommended" },
  meh: { fill: "bg-amber-500", label: "Meh" },
  skip: { fill: "bg-rose-500", label: "Skip it" },
};

function metacriticColor(score: number): string {
  if (score >= 75) return "bg-emerald-600";
  if (score >= 50) return "bg-amber-600";
  return "bg-rose-600";
}

function ChipRow({
  icon: Icon,
  label,
  values,
}: {
  icon: typeof Building2;
  label: string;
  values: string[];
}) {
  if (values.length === 0) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </span>
      <span className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <Badge key={v} variant="secondary" className="font-normal">
            {v}
          </Badge>
        ))}
      </span>
    </div>
  );
}

function PlaytimeCompare({
  yours,
  avg,
}: {
  yours: number | null;
  avg: number | null;
}) {
  if (yours == null && avg == null) return null;
  const max = Math.max(yours ?? 0, avg ?? 0, 1);
  const rows = [
    { label: "Your log", value: yours, fill: "bg-primary" },
    { label: "Players avg", value: avg, fill: "bg-sky-500" },
  ].filter((r) => r.value != null);

  return (
    <div className="grid gap-1.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3 text-xs">
          <span className="w-20 shrink-0 text-right text-muted-foreground">
            {r.label}
          </span>
          <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full ${r.fill}`}
              style={{ width: `${Math.max(((r.value ?? 0) / max) * 100, 3)}%` }}
            />
          </div>
          <span className="w-14 shrink-0 font-medium tabular-nums">
            {r.value}h
          </span>
        </div>
      ))}
    </div>
  );
}

export default function GameDetails({ game }: { game: Game }) {
  const [data, setData] = useState<RawgDetails | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setData(null);
    (async () => {
      try {
        const res = await fetch(
          `/api/games/details?q=${encodeURIComponent(game.name)}`,
        );
        const json = await res.json();
        if (!res.ok || json.configured === false || json.error) {
          throw new Error("details unavailable");
        }
        if (!cancelled) {
          setData(json as RawgDetails);
          setStatus(json.found ? "ready" : "error");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [game.name]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        Fetching details from RAWG...
      </div>
    );
  }

  if (status === "error" || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <Gamepad2 className="size-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">No extra details found</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          RAWG had no match for &ldquo;{game.name}&rdquo;, or the lookup is
          unavailable right now.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Banner */}
      <div className="relative h-40 w-full overflow-hidden sm:h-48">
        {(data.backgroundImage || game.coverUrl) && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={(data.backgroundImage ?? game.coverUrl) as string}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 pb-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h3 className="text-xl font-bold tracking-tight">{data.name}</h3>
            <div className="flex items-center gap-2">
              {data.esrb && (
                <Badge variant="outline" className="border-white/30 bg-black/40 text-white backdrop-blur">
                  {data.esrb}
                </Badge>
              )}
              {typeof data.metacritic === "number" && (
                <Badge
                  className={`${metacriticColor(data.metacritic)} border-transparent font-bold`}
                  title="Metascore"
                >
                  MC {data.metacritic}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5">
        {/* Score + release row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {typeof data.rating === "number" && (
            <span className="flex items-center gap-1.5" title="RAWG rating">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold tabular-nums">
                {data.rating.toFixed(1)}
              </span>
              {typeof data.ratingsCount === "number" && (
                <span className="text-muted-foreground">
                  ({data.ratingsCount.toLocaleString()} reviews)
                </span>
              )}
            </span>
          )}
          {data.released && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarDays className="size-4" />
              {new Date(data.released).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
          {typeof data.avgPlaytime === "number" && data.avgPlaytime > 0 && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock3 className="size-4" />
              {data.avgPlaytime}h average
            </span>
          )}
        </div>

        {/* Your playtime vs the world */}
        <PlaytimeCompare yours={game.playtimeHours} avg={data.avgPlaytime ?? null} />

        {/* Community sentiment */}
        {(data.ratingsBreakdown?.length ?? 0) > 0 && (
          <div className="grid gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Community verdict
            </span>
            {data.ratingsBreakdown!.map((r) => {
              const style =
                BREAKDOWN_STYLES[r.title] ?? {
                  fill: "bg-secondary",
                  label: r.title,
                };
              return (
                <div key={r.title} className="flex items-center gap-3 text-xs">
                  <span className="w-24 shrink-0 text-muted-foreground">
                    {style.label}
                  </span>
                  <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full ${style.fill}`}
                      style={{ width: `${Math.max(r.percent, 2)}%` }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right font-medium tabular-nums">
                    {r.percent}%
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid gap-2">
          <ChipRow icon={Building2} label="Devs" values={data.developers ?? []} />
          <ChipRow icon={Users} label="Publishers" values={data.publishers ?? []} />
          <ChipRow icon={Gamepad2} label="Genres" values={data.genres ?? []} />
          <ChipRow
            icon={Globe}
            label="Platforms"
            values={(data.platforms ?? []).slice(0, 8)}
          />
        </div>

        {data.description && (
          <div className="grid gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              About
            </span>
            <p className="max-h-44 overflow-y-auto whitespace-pre-line pr-2 text-sm leading-relaxed text-muted-foreground">
              {data.description.replace(/\[.*?\]/g, "")}
            </p>
          </div>
        )}

        {data.website && (
          <a
            href={data.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Official website <ExternalLink className="size-3.5" />
          </a>
        )}

        <p className="text-[10px] uppercase tracking-wide text-muted-foreground/60">
          Data provided by RAWG
        </p>
      </div>
    </div>
  );
}
