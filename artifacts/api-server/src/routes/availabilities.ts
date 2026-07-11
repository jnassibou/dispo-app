import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
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

const TIME_BLOCK_ORDER = ["morning", "afternoon", "evening", "night"];

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

  // Optional organizer bonus: participantId who gets +0.5 score boost
  const rawOrganizerId = req.query.organizerParticipantId;
  const organizerParticipantId = rawOrganizerId
    ? parseInt(String(rawOrganizerId), 10)
    : null;

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
        topSlots: [],
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

  // Sort with tie-breakers:
  // 1. Score = count + 0.5 bonus if organizer is present
  // 2. Chronological date (earlier first)
  // 3. Time block order (morning → night)
  const sorted = Object.entries(slotMap).sort((a, b) => {
    const scoreA =
      a[1].size +
      (organizerParticipantId !== null && a[1].has(organizerParticipantId)
        ? 0.5
        : 0);
    const scoreB =
      b[1].size +
      (organizerParticipantId !== null && b[1].has(organizerParticipantId)
        ? 0.5
        : 0);
    if (scoreB !== scoreA) return scoreB - scoreA;

    const [dateA, tbA] = a[0].split("|");
    const [dateB, tbB] = b[0].split("|");
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return TIME_BLOCK_ORDER.indexOf(tbA) - TIME_BLOCK_ORDER.indexOf(tbB);
  });

  // Build top 3 response items
  const topSlots = sorted.slice(0, 3).map(([key, presentIds]) => {
    const [date, timeBlock] = key.split("|");
    const absentNames = allParticipants
      .filter((p) => !presentIds.has(p.id))
      .map((p) => p.name);
    return { date, timeBlock, participantCount: presentIds.size, absentNames };
  });

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
      topSlots,
    })
  );
});

export default router;
