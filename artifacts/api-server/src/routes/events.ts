import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, eventsTable, participantsTable } from "@workspace/db";
import {
  CreateEventBody,
  CreateEventResponse,
  GetEventParams,
  GetEventResponse,
  GetEventSummaryParams,
  GetEventSummaryResponse,
} from "@workspace/api-zod";
import { availabilitySlotsTable, activityVotesTable, activitiesTable } from "@workspace/db";

const router: IRouter = Router();

function generateShareCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

router.post("/events", async (req, res): Promise<void> => {
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const shareCode = generateShareCode();
  const [event] = await db
    .insert(eventsTable)
    .values({
      name: parsed.data.name,
      emoji: parsed.data.emoji,
      shareCode,
      mode: parsed.data.mode ?? "both",
      dates: JSON.stringify(parsed.data.dates ?? []),
    })
    .returning();

  const response = CreateEventResponse.parse({
    ...event,
    dates: JSON.parse(event.dates),
    participantCount: 0,
  });
  res.status(201).json(response);
});

router.get("/events/:shareCode", async (req, res): Promise<void> => {
  const rawCode = Array.isArray(req.params.shareCode)
    ? req.params.shareCode[0]
    : req.params.shareCode;
  const params = GetEventParams.safeParse({ shareCode: rawCode });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [event] = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.shareCode, params.data.shareCode));

  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(participantsTable)
    .where(eq(participantsTable.eventId, event.id));

  const response = GetEventResponse.parse({
    ...event,
    dates: JSON.parse(event.dates),
    participantCount: count,
  });
  res.json(response);
});

router.get("/events/:shareCode/summary", async (req, res): Promise<void> => {
  const rawCode = Array.isArray(req.params.shareCode)
    ? req.params.shareCode[0]
    : req.params.shareCode;
  const params = GetEventSummaryParams.safeParse({ shareCode: rawCode });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [event] = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.shareCode, params.data.shareCode));

  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(participantsTable)
    .where(eq(participantsTable.eventId, event.id));

  // Best slot
  const slots = await db
    .select()
    .from(availabilitySlotsTable)
    .where(eq(availabilitySlotsTable.eventId, event.id));

  let bestDate: string | null = null;
  let bestTimeBlock: string | null = null;
  if (slots.length > 0) {
    const slotMap: Record<string, number> = {};
    for (const slot of slots) {
      const key = `${slot.date}|${slot.timeBlock}`;
      slotMap[key] = (slotMap[key] ?? 0) + 1;
    }
    const best = Object.entries(slotMap).sort((a, b) => b[1] - a[1])[0];
    if (best) {
      [bestDate, bestTimeBlock] = best[0].split("|");
    }
  }

  // Top activity
  const votes = await db
    .select()
    .from(activityVotesTable)
    .innerJoin(participantsTable, eq(activityVotesTable.participantId, participantsTable.id))
    .where(eq(participantsTable.eventId, event.id));

  let topActivity: string | null = null;
  let topActivityEmoji: string | null = null;
  if (votes.length > 0) {
    const voteMap: Record<number, number> = {};
    for (const { activity_votes } of votes) {
      if (activity_votes.liked) {
        voteMap[activity_votes.activityId] = (voteMap[activity_votes.activityId] ?? 0) + 1;
      }
    }
    const topId = Object.entries(voteMap).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (topId) {
      const [activity] = await db
        .select()
        .from(activitiesTable)
        .where(eq(activitiesTable.id, parseInt(topId, 10)));
      if (activity) {
        topActivity = activity.name;
        topActivityEmoji = activity.emoji;
      }
    }
  }

  const response = GetEventSummaryResponse.parse({
    ...event,
    participantCount: count,
    bestDate: bestDate ?? null,
    bestTimeBlock: bestTimeBlock ?? null,
    topActivity: topActivity ?? null,
    topActivityEmoji: topActivityEmoji ?? null,
  });
  res.json(response);
});

export default router;
