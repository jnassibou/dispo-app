import { useState } from "react"

const STORAGE_KEY = "dispo_my_events"

export interface MyEvent {
  shareCode: string
  name: string
  emoji: string
  mode: string
  createdAt: string
}

export function useMyEvents() {
  const [events, setEvents] = useState<MyEvent[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const addEvent = (event: MyEvent) => {
    setEvents(prev => {
      const updated = [event, ...prev.filter(e => e.shareCode !== event.shareCode)]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  return { events, addEvent }
}

/** Standalone helper usable outside React (e.g. after a mutation callback) */
export function persistMyEvent(event: MyEvent) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const current: MyEvent[] = stored ? JSON.parse(stored) : []
    const updated = [event, ...current.filter(e => e.shareCode !== event.shareCode)]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {}
}

/** Mark a shareCode as "created by this user" so EventHub can flag the organizer */
export function markAsCreator(shareCode: string) {
  localStorage.setItem(`dispo_creator_${shareCode}`, "1")
}

export function isCreator(shareCode: string) {
  return localStorage.getItem(`dispo_creator_${shareCode}`) === "1"
}

export function setOrganizerParticipantId(shareCode: string, participantId: number) {
  localStorage.setItem(`dispo_organizer_${shareCode}`, String(participantId))
}

export function getOrganizerParticipantId(shareCode: string): number | null {
  const v = localStorage.getItem(`dispo_organizer_${shareCode}`)
  return v ? parseInt(v, 10) : null
}
