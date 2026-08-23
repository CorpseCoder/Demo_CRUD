import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

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

// Fresh timeout per call: AbortSignal.timeout() starts counting when created,
// so a module-level signal would be dead before the first request arrives.
function rawgFetch(url: string) {
  return fetch(url, {
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 86400 },
  });
}

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// Score how well a RAWG candidate matches the library entry's name.
function matchScore(candidate: string, query: string): number {
  const c = normalizeName(candidate);
  const q = normalizeName(query);
  if (!c || !q) return 0;
  if (c === q) return 100;
  if (c.startsWith(q) || q.startsWith(c)) return 75;
  if (c.includes(q) || q.includes(c)) return 50;
  return 0;
}

// RAWG indexes hundreds of thousands of junk/obscure entries whose names can
// coincide with arbitrary queries. Community traction separates real titles
// from noise, so require a few reviews before trusting a match.
const MIN_RATINGS_COUNT = 5;

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
    // Resolve the library entry's name to a concrete RAWG id, picking the
    // best-matching candidate rather than blindly trusting rank #1.
    const searchRes = await rawgFetch(
      `https://api.rawg.io/api/games?key=${encodeURIComponent(apiKey)}&search=${encodeURIComponent(q)}&page_size=6`,
    );
    if (!searchRes.ok) throw new Error(`search ${searchRes.status}`);
    const searchData = (await searchRes.json()) as {
      results?: { id: number; name: string; ratings_count?: number }[];
    };
    const candidates = searchData.results ?? [];
    let best: { id: number; score: number; votes: number } | null = null;
    for (const c of candidates) {
      const votes = c.ratings_count ?? 0;
      const score = matchScore(c.name, q);
      if (score < 50 || votes < MIN_RATINGS_COUNT) continue;
      // Prefer the stronger name match; break ties by popularity.
      if (
        !best ||
        score > best.score ||
        (score === best.score && votes > best.votes)
      ) {
        best = { id: c.id, score, votes };
      }
    }
    if (!best) {
      return NextResponse.json({ configured: true, found: false });
    }

    // ...then pull the full record for it.
    const detailRes = await rawgFetch(
      `https://api.rawg.io/api/games/${best.id}?key=${encodeURIComponent(apiKey)}`,
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
