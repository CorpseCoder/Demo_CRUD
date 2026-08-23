import { z } from "zod";

export const STATUS_VALUES = [
  "backlog",
  "playing",
  "completed",
  "paused",
  "dropped",
] as const;

export type Status = (typeof STATUS_VALUES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  backlog: "Backlog",
  playing: "Playing",
  completed: "Completed",
  paused: "Paused",
  dropped: "Dropped",
};

export const PLATFORMS = [
  "PC",
  "PlayStation 5",
  "PlayStation 4",
  "Xbox Series X|S",
  "Xbox One",
  "Nintendo Switch",
  "Mobile",
  "Retro",
  "Other",
] as const;

export const gameInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(140),
  platform: z.string().trim().min(1, "Platform is required").max(60),
  status: z.enum(STATUS_VALUES),
  rating: z.number().int().min(1).max(5).nullable(),
  review: z.string().trim().max(2000).nullable(),
  achievements: z
    .array(z.string().trim().min(1).max(100))
    .max(40)
    .nullable()
    .transform((v) => v ?? []),
  playtimeHours: z.number().int().min(0).max(100000).nullable(),
  coverUrl: z.string().trim().url("Must be a valid URL").max(500).nullable()
    .or(z.literal("").transform(() => null)),
  notes: z.string().trim().max(2000).nullable(),
  favorite: z.boolean(),
  releaseYear: z.number().int().min(1950).max(2100).nullable(),
  genre: z.string().trim().max(60).nullable(),
});

export type GameInput = z.infer<typeof gameInputSchema>;

export const idSchema = z.string().uuid();
