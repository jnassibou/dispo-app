import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, eventsTable, participantsTable, availabilitySlotsTable } from "@workspace/db";
import {
  ListAvailabilitiesParams,
  ListAvailabilitiesResponse,
  SubmitAvailabilitiesParams,
  SubmitAvailabilitiesBody,
  SubmitAvailabilitiesResponse,
  GetBestSlotParams,
  GetBestSlotResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/events/:shareCode/availabilities", async (req, res): Promise<void> => {
  const rawCode = Array.isArray(req.params.shareCode)
    ? req.params.shareCode[0]
    : req.params.shareCode;
  const params = ListAvailabilitiesParams.safeParse({ shareCode: rawCode });
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

  const slots = await db
    .select()
    .from(availabilitySlotsTable)
    .where(eq(availabilitySlotsTable.eventId, event.id));

  res.json(ListAvailabilitiesResponse.parse(slots));
});

router.post("/events/:shareCode/availabilities", async (req, res): Promise<void> => {
  const rawCode = Array.isArray(req.params.shareCode)
    ? req.params.shareCode[0]
    : req.params.shareCode;
  const params = SubmitAvailabilitiesParams.safeParse({ shareCode: rawCode });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = SubmitAvailabilitiesBody.safeParse(req.body);
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
    .select()
    .from(participantsTable)
    .where(eq(participantsTable.id, body.data.participantId));

  if (!participant || participant.eventId !== event.id) {
    res.status(404).json({ error: "Participant not found in this event" });
    return;
  }

  // Delete existing slots for this participant and re-insert
  await db
    .delete(availabilitySlotsTable)
    .where(eq(availabilitySlotsTable.participantId, participant.id));

  const inserted = await db
    .insert(availabilitySlotsTable)
    .values(
      body.data.slots.map((s) => ({
        participantId: participant.id,
        eventId: event.id,
        date: s.date,
        timeBlock: s.timeBlock,
      }))
    )
    .returning();

  res.status(201).json(SubmitAvailabilitiesResponse.parse(inserted));
});

router.get("/events/:shareCode/best-slot", async (req, res): Promise<void> => {
  const rawCode = Array.isArray(req.params.shareCode)
    ? req.params.shareCode[0]
    : req.params.shareCode;
  const params = GetBestSlotParams.safeParse({ shareCode: rawCode });
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

  const allParticipants = await db
    .select()
    .from(participantsTable)
    .where(eq(participantsTable.eventId, event.id));

  const totalParticipants = allParticipants.length;

  const slots = await db
    .select()
    .from(availabilitySlotsTable)
    .where(eq(availabilitySlotsTable.eventId, event.id));

  if (slots.length === 0 || totalParticipants === 0) {
    res.json(
      GetBestSlotResponse.parse({
        date: null,
        timeBlock: null,
        participantCount: 0,
        totalParticipants,
        hasMatch: false,
        absentNames: [],
      })
    );
    return;
  }

  // Count how many unique participants selected each slot
  const slotMap: Record<string, Set<number>> = {};
  for (const slot of slots) {
    const key = `${slot.date}|${slot.timeBlock}`;
    if (!slotMap[key]) slotMap[key] = new Set();
    slotMap[key].add(slot.participantId);
  }

  const sorted = Object.entries(slotMap).sort(
    (a, b) => b[1].size - a[1].size
  );
  const best = sorted[0];
  const [bestDate, bestTimeBlock] = best[0].split("|");
  const presentIds = best[1];
  const participantCount = presentIds.size;

  const absentNames = allParticipants
    .filter((p) => !presentIds.has(p.id))
    .map((p) => p.name);

  res.json(
    GetBestSlotResponse.parse({
      date: bestDate,
      timeBlock: bestTimeBlock,
      participantCount,
      totalParticipants,
      hasMatch: participantCount === totalParticipants,
      absentNames,
    })
  );
});

export default router;
