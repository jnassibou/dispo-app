import { useState, useEffect } from "react"
import { useRoute, Link, useLocation } from "wouter"
import { motion } from "framer-motion"
import {
  useListAvailabilities,
  useSubmitAvailabilities,
  useGetEvent,
  getListAvailabilitiesQueryKey,
  getGetEventQueryKey,
} from "@workspace/api-client-react"
import { useParticipant } from "@/hooks/use-participant"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Loader2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"

const TIME_BLOCKS = [
  { id: "morning",   label: "Matin",  emoji: "🌅" },
  { id: "afternoon", label: "Aprem",  emoji: "☀️" },
  { id: "evening",   label: "Soir",   emoji: "🌇" },
  { id: "night",     label: "Nuit",   emoji: "🌙" },
]

export default function AvailabilityPicker() {
  const [, params] = useRoute("/event/:shareCode/availabilities")
  const shareCode = params?.shareCode || ""
  const [, setLocation] = useLocation()
  const { participant } = useParticipant(shareCode)

  const { data: event, isLoading: eventLoading } = useGetEvent(shareCode, {
    query: { enabled: !!shareCode, queryKey: getGetEventQueryKey(shareCode) },
  })

  const { data: availabilities, isLoading: availLoading } = useListAvailabilities(shareCode, {
    query: { enabled: !!shareCode, queryKey: getListAvailabilitiesQueryKey(shareCode) },
  })

  const submitAvailabilities = useSubmitAvailabilities()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Pre-fill from existing data
  useEffect(() => {
    if (availabilities && participant) {
      const myAvails = availabilities.filter(a => a.participantId === participant.id)
      setSelected(new Set(myAvails.map(a => `${a.date}_${a.timeBlock}`)))
    }
  }, [availabilities, participant])

  const toggleSlot = (date: string, timeBlock: string) => {
    const key = `${date}_${timeBlock}`
    setSelected(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const handleSave = () => {
    if (!participant) return
    const slots = Array.from(selected).map(key => {
      const [date, timeBlock] = key.split("_")
      return { date, timeBlock }
    })
    submitAvailabilities.mutate(
      { shareCode, data: { participantId: participant.id, slots } },
      { onSuccess: () => setLocation(`/event/${shareCode}`) }
    )
  }

  if (!participant) {
    setLocation(`/event/${shareCode}`)
    return null
  }

  const isLoading = eventLoading || availLoading

  // Use organizer's specific dates, or fall back to empty
  const eventDates: string[] = event?.dates ?? []

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Sub-header with back */}
      <div className="p-4 flex items-center border-b border-card-border bg-card/50 backdrop-blur-md sticky top-14 z-40">
        <Link href={`/event/${shareCode}`}>
          <Button variant="ghost" size="icon" className="rounded-full mr-2">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div>
          <h2 className="text-lg font-bold leading-tight">Mes Dispos</h2>
          {selected.size > 0 && (
            <p className="text-xs text-primary font-medium">{selected.size} créneau{selected.size > 1 ? "x" : ""} sélectionné{selected.size > 1 ? "s" : ""}</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 pb-28">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : eventDates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <span className="text-5xl">📅</span>
            <p className="text-muted-foreground font-medium">L'organisateur n'a pas encore choisi de dates.</p>
            <Link href={`/event/${shareCode}`}>
              <Button variant="outline">Retour</Button>
            </Link>
          </div>
        ) : (
          <div className="w-full">
            {/* ── INVERTED GRID: dates = rows (Y), time blocks = columns (X) ── */}

            {/* Column headers: time blocks */}
            <div className="flex gap-2 mb-3 pl-[72px]">
              {TIME_BLOCKS.map(block => (
                <div key={block.id} className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-lg leading-none">{block.emoji}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{block.label}</span>
                </div>
              ))}
            </div>

            {/* Date rows */}
            <div className="flex flex-col gap-2">
              {eventDates.map((dateStr, rowIdx) => {
                const parsed = parseISO(dateStr)
                const dayName = format(parsed, "eee", { locale: fr })
                const dayNum  = format(parsed, "dd")
                const month   = format(parsed, "MMM", { locale: fr })

                return (
                  <motion.div
                    key={dateStr}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: rowIdx * 0.04 }}
                    className="flex gap-2 items-center"
                  >
                    {/* Row label */}
                    <div className="w-[64px] shrink-0 flex flex-col items-end pr-1">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase">{dayName}</span>
                      <span className="text-xl font-black text-white leading-none">{dayNum}</span>
                      <span className="text-[10px] text-muted-foreground capitalize">{month}</span>
                    </div>

                    {/* Tap cells */}
                    {TIME_BLOCKS.map(block => {
                      const isSelected = selected.has(`${dateStr}_${block.id}`)
                      return (
                        <motion.button
                          key={block.id}
                          whileTap={{ scale: 0.82 }}
                          onClick={() => toggleSlot(dateStr, block.id)}
                          className="flex-1 aspect-square rounded-2xl border-2 transition-colors"
                          style={isSelected ? {
                            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
                            borderColor: "transparent",
                            boxShadow: "0 0 16px 0 hsla(var(--primary) / 0.45)",
                          } : {
                            background: "hsl(var(--card))",
                            borderColor: "hsl(var(--card-border))",
                          }}
                          animate={isSelected ? { scale: [1, 1.12, 1] } : {}}
                          transition={{ duration: 0.22 }}
                        />
                      )
                    })}
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sticky save button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-card-border z-50">
        <Button
          className="w-full h-14 text-lg rounded-full"
          onClick={handleSave}
          disabled={submitAvailabilities.isPending || eventDates.length === 0}
        >
          {submitAvailabilities.isPending
            ? <Loader2 className="animate-spin w-6 h-6" />
            : "Sauvegarder ✨"}
        </Button>
      </div>
    </div>
  )
}
