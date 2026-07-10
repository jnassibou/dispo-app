import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, eventsTable, participantsTable } from "@workspace/db";
import {
  JoinEventParams,
  JoinEventBody,
  JoinEventResponse,
  ListParticipantsParams,
  ListParticipantsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/events/:shareCode/participants", async (req, res): Promise<void> => {
  const rawCode = Array.isArray(req.params.shareCode)
    ? req.params.shareCode[0]
    : req.params.shareCode;
  const params = ListParticipantsParams.safeParse({ shareCode: rawCode });
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

  const participants = await db
    .select()
    .from(participantsTable)
    .where(eq(participantsTable.eventId, event.id));

  res.json(ListParticipantsResponse.parse(participants));
});

router.post("/events/:shareCode/participants", async (req, res): Promise<void> => {
  const rawCode = Array.isArray(req.params.shareCode)
    ? req.params.shareCode[0]
    : req.params.shareCode;
  const params = JoinEventParams.safeParse({ shareCode: rawCode });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = JoinEventBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
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

  const [participant] = await db
    .insert(participantsTable)
    .values({ eventId: event.id, name: body.data.name })
    .returning();

  res.status(201).json(JoinEventResponse.parse(participant));
});

export default router;
