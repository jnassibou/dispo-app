import { useState, useEffect } from "react"

export function useParticipant(shareCode: string) {
  const key = `dispo_participant_${shareCode}`
  const [participant, setParticipant] = useState<{ id: number; name: string } | null>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : null
    } catch (e) {
      return null
    }
  })

  const saveParticipant = (id: number, name: string) => {
    const data = { id, name }
    localStorage.setItem(key, JSON.stringify(data))
    setParticipant(data)
  }

  return { participant, saveParticipant }
}
