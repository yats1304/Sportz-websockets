import { Router } from "express";
import { db } from "../db/db.js";
import { commentary } from "../schema/schema.js";
import { matchIdParamSchema } from "../validation/matches.js";
import {
  listCommentaryQuerySchema,
  createCommentarySchema,
} from "../validation/commentary.js";
import { eq, desc } from "drizzle-orm";

export const commentaryRouter = Router({ mergeParams: true });

const MAX_LIMIT = 100;

// GET /matches/:id/commentary
commentaryRouter.get("/", async (req, res) => {
  try {
    // Validate route param
    const { id: matchId } = matchIdParamSchema.parse(req.params);

    // Validate query params
    const { limit } = listCommentaryQuerySchema.parse(req.query);

    // Fetch commentary for the match
    const data = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, matchId))
      .orderBy(desc(commentary.createdAt))
      .limit(Math.min(limit ?? MAX_LIMIT, MAX_LIMIT));

    return res.json({ data });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
    }

    console.error("GET /commentary error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /matches/:id/commentary
commentaryRouter.post("/", async (req, res) => {
  try {
    // Validate route param
    const { id: matchId } = matchIdParamSchema.parse(req.params);

    // Validate request body
    const body = createCommentarySchema.parse(req.body);

    // Insert into commentary table
    const [created] = await db
      .insert(commentary)
      .values({
        matchId,
        minute: body.minute,
        sequence: body.sequence,
        period: body.period,
        eventType: body.eventType,
        actor: body.actor,
        team: body.team,
        message: body.message,
        metadata: body.metadata,
        tags: body.tags,
      })
      .returning();

    if (res.app.locals.broadcastCommentary) {
      res.app.locals.broadcastCommentary(created.matchId, created);
    }

    return res.status(201).json(created);
  } catch (error) {
    // Zod validation errors
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
    }

    console.error("POST /commentary error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
