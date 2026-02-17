import { z } from "zod";

// Match status constants
export const MATCH_STATUS = {
  SCHEDULED: "scheduled",
  LIVE: "live",
  FINISHED: "finished",
};

// Validation schema for listing matches with query parameters
export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// Validation schema for match ID parameter
export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Validation schema for creating a match
export const createMatchSchema = z
  .object({
    sport: z.string().min(1, "Sport is required"),
    homeTeam: z.string().min(1, "Home team is required"),
    awayTeam: z.string().min(1, "Away team is required"),
    startTime: z.string().refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime()) && date.toISOString() === val;
      },
      { message: "Start time must be a valid ISO date string" },
    ),
    endTime: z.string().refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime()) && date.toISOString() === val;
      },
      { message: "End time must be a valid ISO date string" },
    ),
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after start time",
        path: ["endTime"],
      });
    }
  });

// Validation schema for updating match scores
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});
