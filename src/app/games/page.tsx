import { headers } from "next/headers";
import { redirect } from "next/navigation";

import Dashboard, { type GameCardData } from "@/components/Dashboard";
import { listGames } from "@/lib/actions";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  let games: GameCardData[] = [];
  try {
    games = (await listGames()).map((g) => ({
      ...g,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
    }));
  } catch (e) {
    console.error(e);
  }

  return <Dashboard user={session.user} initialGames={games} />;
}
