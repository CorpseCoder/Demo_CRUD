import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

type RawgGame = {
  id: number;
  name: string;
  background_image?: string | null;
  released?: string | null;
  genres?: { name: string }[] | null;
};

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ configured: false, results: [] });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) {
    return NextResponse.json({ configured: true, results: [] });
  }

  try {
    const upstream = await fetch(
      `https://api.rawg.io/api/games?key=${encodeURIComponent(apiKey)}&search=${encodeURIComponent(q)}&page_size=8`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!upstream.ok) {
      return NextResponse.json({ configured: true, results: [] });
    }
    const data = (await upstream.json()) as { results?: RawgGame[] };
    const results = (data.results ?? [])
      .filter((g) => Boolean(g.background_image))
      .map((g) => ({
        id: g.id,
        name: g.name,
        image: g.background_image as string,
        released: g.released ?? null,
        genres: (g.genres ?? []).map((x) => x.name).slice(0, 2),
      }));
    return NextResponse.json({ configured: true, results });
  } catch (e) {
    console.error("RAWG search failed:", e);
    return NextResponse.json({ configured: true, results: [] });
  }
}
