import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

type RawgSearchResult = { id: number };

type RawgDetail = {
  name: string;
  description_raw?: string | null;
  metacritic?: number | null;
  rating?: number | null;
  ratings_count?: number | null;
  released?: string | null;
  playtime?: number | null;
  website?: string | null;
  background_image?: string | null;
  developers?: { name: string }[] | null;
  publishers?: { name: string }[] | null;
  genres?: { name: string }[] | null;
  platforms?: { platform: { name: string } }[] | null;
  esrb_rating?: { name: string } | null;
  ratings?: { title: string; count: number }[] | null;
};

const FETCH_OPTS = {
  signal: AbortSignal.timeout(8000),
  next: { revalidate: 86400 },
} as const;

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ configured: false, found: false });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) {
    return NextResponse.json({ configured: true, found: false });
  }

  try {
    // Resolve the library entry's name to a concrete RAWG id...
    const searchRes = await fetch(
      `https://api.rawg.io/api/games?key=${encodeURIComponent(apiKey)}&search=${encodeURIComponent(q)}&search_precise=true&page_size=1`,
      FETCH_OPTS,
    );
    if (!searchRes.ok) throw new Error(`search ${searchRes.status}`);
    const searchData =
      (await searchRes.json()) as { results?: RawgSearchResult[] };
    const id = searchData.results?.[0]?.id;
    if (!id) {
      return NextResponse.json({ configured: true, found: false });
    }

    // ...then pull the full record for it.
    const detailRes = await fetch(
      `https://api.rawg.io/api/games/${id}?key=${encodeURIComponent(apiKey)}`,
      FETCH_OPTS,
    );
    if (!detailRes.ok) throw new Error(`detail ${detailRes.status}`);
    const d = (await detailRes.json()) as RawgDetail;

    const totalRatings = (d.ratings ?? []).reduce((s, r) => s + r.count, 0);

    return NextResponse.json({
      configured: true,
      found: true,
      name: d.name,
      description: d.description_raw ?? null,
      metacritic: d.metacritic ?? null,
      rating: d.rating ?? null,
      ratingsCount: d.ratings_count ?? null,
      released: d.released ?? null,
      avgPlaytime: d.playtime ?? null,
      website: d.website || null,
      backgroundImage: d.background_image ?? null,
      developers: (d.developers ?? []).map((x) => x.name).slice(0, 4),
      publishers: (d.publishers ?? []).map((x) => x.name).slice(0, 3),
      genres: (d.genres ?? []).map((x) => x.name).slice(0, 5),
      platforms: (d.platforms ?? []).map((x) => x.platform.name),
      esrb: d.esrb_rating?.name ?? null,
      ratingsBreakdown: (d.ratings ?? []).map((r) => ({
        title: r.title,
        percent: totalRatings ? Math.round((r.count / totalRatings) * 100) : 0,
        count: r.count,
      })),
    });
  } catch (e) {
    console.error("RAWG details failed:", e);
    return NextResponse.json(
      { configured: true, found: false, error: "upstream" },
      { status: 502 },
    );
  }
}
