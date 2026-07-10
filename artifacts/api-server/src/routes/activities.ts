import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, eventsTable, participantsTable } from "@workspace/db";
import { activitiesTable, activityVotesTable } from "@workspace/db";
import {
  ListActivitiesParams,
  ListActivitiesResponse,
  SubmitActivityVoteParams,
  SubmitActivityVoteBody,
  SubmitActivityVoteResponse,
  GetActivityMatchesParams,
  GetActivityMatchesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/events/:shareCode/activities", async (req, res): Promise<void> => {
  const rawCode = Array.isArray(req.params.shareCode)
    ? req.params.shareCode[0]
    : req.params.shareCode;
  const params = ListActivitiesParams.safeParse({ shareCode: rawCode });
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

  const activities = await db.select().from(activitiesTable);
  res.json(ListActivitiesResponse.parse(activities));
});

router.post("/events/:shareCode/activity-votes", async (req, res): Promise<void> => {
  const rawCode = Array.isArray(req.params.shareCode)
    ? req.params.shareCode[0]
    : req.params.shareCode;
  const params = SubmitActivityVoteParams.safeParse({ shareCode: rawCode });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = SubmitActivityVoteBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  // Verify event exists
  const [event] = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.shareCode, params.data.shareCode));

  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  // Verify participant belongs to this event
  const [participant] = await db
    .select()
    .from(participantsTable)
    .where(eq(participantsTable.id, body.data.participantId));

  if (!participant || participant.eventId !== event.id) {
    res.status(404).json({ error: "Participant not found in this event" });
    return;
  }

  // Upsert: delete existing vote for this participant+activity, then insert
  await db
    .delete(activityVotesTable)
    .where(
      sql`${activityVotesTable.participantId} = ${body.data.participantId} AND ${activityVotesTable.activityId} = ${body.data.activityId}`
    );

  const [vote] = await db
    .insert(activityVotesTable)
    .values({
      participantId: body.data.participantId,
      activityId: body.data.activityId,
      liked: body.data.liked,
    })
    .returning();

  res.status(201).json(SubmitActivityVoteResponse.parse(vote));
});

router.get("/events/:shareCode/activity-matches", async (req, res): Promise<void> => {
  const rawCode = Array.isArray(req.params.shareCode)
    ? req.params.shareCode[0]
    : req.params.shareCode;
  const params = GetActivityMatchesParams.safeParse({ shareCode: rawCode });
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

  const [{ totalParticipants }] = await db
    .select({ totalParticipants: sql<number>`count(*)::int` })
    .from(participantsTable)
    .where(eq(participantsTable.eventId, event.id));

  // Get all activities with like counts for this event
  const activities = await db.select().from(activitiesTable);

  const votes = await db
    .select()
    .from(activityVotesTable)
    .innerJoin(participantsTable, eq(activityVotesTable.participantId, participantsTable.id))
    .where(eq(participantsTable.eventId, event.id));

  const likeCounts: Record<number, number> = {};
  for (const { activity_votes } of votes) {
    if (activity_votes.liked) {
      likeCounts[activity_votes.activityId] = (likeCounts[activity_votes.activityId] ?? 0) + 1;
    }
  }

  const result = activities.map((activity) => ({
    activityId: activity.id,
    name: activity.name,
    emoji: activity.emoji,
    category: activity.category,
    likeCount: likeCounts[activity.id] ?? 0,
    totalParticipants,
    isMatch: totalParticipants > 0 && (likeCounts[activity.id] ?? 0) === totalParticipants,
  }));

  res.json(GetActivityMatchesResponse.parse(result));
});

export default router;
