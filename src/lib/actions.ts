"use server";

import { randomUUID } from "node:crypto";

import { and, desc, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { games } from "@/db/schema";
import { auth } from "@/lib/auth";
import { gameInputSchema, idSchema } from "@/lib/validation";
import type { GameInput } from "@/lib/validation";

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("UNAUTHENTICATED");
  return session.user.id;
}

function fail(error: unknown): { ok: false; error: string } {
  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return { ok: false, error: "You must be signed in." };
  }
  if (error instanceof Error && error.message === "NOT_FOUND") {
    return { ok: false, error: "Game not found." };
  }
  console.error(error);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function createGame(
  input: GameInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId();
    const data = gameInputSchema.parse(input);
    const [row] = await db
      .insert(games)
      .values({ id: randomUUID(), userId, ...data })
      .returning({ id: games.id });
    revalidatePath("/games");
    return { ok: true, id: row.id };
  } catch (e) {
    return fail(e);
  }
}

export async function updateGame(
  id: string,
  input: GameInput,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const userId = await requireUserId();
    const gameId = idSchema.parse(id);
    const data = gameInputSchema.parse(input);
    const rows = await db
      .update(games)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(games.id, gameId), eq(games.userId, userId)))
      .returning({ id: games.id });
    if (rows.length === 0) throw new Error("NOT_FOUND");
    revalidatePath("/games");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteGame(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const userId = await requireUserId();
    const gameId = idSchema.parse(id);
    const rows = await db
      .delete(games)
      .where(and(eq(games.id, gameId), eq(games.userId, userId)))
      .returning({ id: games.id });
    if (rows.length === 0) throw new Error("NOT_FOUND");
    revalidatePath("/games");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function toggleFavorite(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const userId = await requireUserId();
    const gameId = idSchema.parse(id);
    const rows = await db
      .update(games)
      .set({ favorite: sql`NOT ${games.favorite}`, updatedAt: new Date() })
      .where(and(eq(games.id, gameId), eq(games.userId, userId)))
      .returning({ id: games.id });
    if (rows.length === 0) throw new Error("NOT_FOUND");
    revalidatePath("/games");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export type GameRow = typeof games.$inferSelect;

export async function listGames(): Promise<GameRow[]> {
  const userId = await requireUserId();
  return db
    .select()
    .from(games)
    .where(eq(games.userId, userId))
    .orderBy(desc(games.createdAt));
}
