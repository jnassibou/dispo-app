import { useState } from "react"
import { useLocation } from "wouter"
import { motion, AnimatePresence } from "framer-motion"
import { useCreateEvent } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Loader2, Copy, Check } from "lucide-react"
import { format, getDaysInMonth, startOfMonth, addMonths, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"

const EMOJIS = [
  "🍻", "🍕", "🎬", "🎮", "🍿", "🎉", "🔥", "✨",
  "🍔", "🍹", "🎤", "🎳", "🏕️", "🚀", "🕺", "💃",
  "🌮", "🍣", "🎵", "🍷"
]

type Mode = "date" | "activity" | "both"
type Step = 1 | 2 | 3 | 4

const MODES: { id: Mode; label: string; emoji: string; desc: string }[] = [
  { id: "date", emoji: "🗓️", label: "Trouver une date", desc: "Vote pour les créneaux dispo" },
  { id: "activity", emoji: "🎯", label: "Choisir une activité", desc: "Swipe les idées d'activités" },
  { id: "both", emoji: "🔥", label: "Les deux !", desc: "Date + activité, le combo parfait" },
]

export default function CreateEvent() {
  const [, setLocation] = useLocation()
  const [step, setStep] = useState<Step>(1)
  const [mode, setMode] = useState<Mode>("both")
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [name, setName] = useState("")
  const [emoji, setEmoji] = useState("🎉")
  const [createdShareCode, setCreatedShareCode] = useState("")
  const [copied, setCopied] = useState(false)

  const createEvent = useCreateEvent()

  // ── Step 1: mode selection ──────────────────────────────────────────────────
  const handleModeSelect = (m: Mode) => {
    setMode(m)
    setStep(m === "activity" ? 3 : 2)
  }

  // ── Step 2: date picking ────────────────────────────────────────────────────
  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDow = startOfMonth(currentMonth).getDay() // 0=Sun
  const adjustedFirstDow = (firstDow + 6) % 7 // Monday-first

  const toggleDate = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    setSelectedDates(prev =>
      prev.some(x => isSameDay(x, d)) ? prev.filter(x => !isSameDay(x, d)) : [...prev, d]
    )
  }

  // ── Step 3: name + emoji + submit ───────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const isoDateStrings = selectedDates
      .sort((a, b) => a.getTime() - b.getTime())
      .map(d => format(d, "yyyy-MM-dd"))

    createEvent.mutate(
      { data: { name, emoji, mode, dates: isoDateStrings } },
      {
        onSuccess: (event) => {
          setCreatedShareCode(event.shareCode)
          setStep(4)
          // Persist to dashboard list + mark this device as the creator
          import("@/hooks/use-my-events").then(({ persistMyEvent, markAsCreator }) => {
            persistMyEvent({
              shareCode: event.shareCode,
              name,
              emoji,
              mode,
              createdAt: new Date().toISOString(),
            })
            markAsCreator(event.shareCode)
          })
        }
      }
    )
  }

  // ── Step 4: share ────────────────────────────────────────────────────────────
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}${import.meta.env.BASE_URL}event/${createdShareCode}`
    : ""

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${emoji} ${name}`, text: "Rejoins notre plan sur Dispo ?", url: shareUrl })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  }

  return (
    <div className="flex-1 w-full p-6 flex flex-col">
      {/* Back / step indicator — hidden on success screen */}
      {step !== 4 && (
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => {
              if (step === 1) setLocation("/")
              else if (step === 2) setStep(1)
              else setStep(mode === "activity" ? 1 : 2)
            }}
            className="w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          {/* Step dots */}
          <div className="flex gap-1.5">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === step ? "w-6 bg-primary neon-shadow-primary" : s < step ? "w-3 bg-primary/50" : "w-3 bg-card-border"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ── STEP 1: Mode ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-8">
              <h1 className="text-3xl font-black text-white mb-2">C'est pour quoi ?</h1>
              <p className="text-muted-foreground">Choisis ce que tu veux organiser</p>
            </div>

            <div className="flex flex-col gap-4 flex-1">
              {MODES.map((m, i) => (
                <motion.button
                  key={m.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => handleModeSelect(m.id)}
                  className={`w-full p-5 rounded-3xl border-2 text-left transition-all active:scale-[0.97] ${
                    m.id === "both"
                      ? "border-secondary/50 bg-secondary/10 hover:bg-secondary/20 neon-shadow-secondary"
                      : "border-card-border bg-card hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  <div className="text-4xl mb-2">{m.emoji}</div>
                  <div className="text-lg font-bold text-white">{m.label}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{m.desc}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Date picking ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-6">
              <h1 className="text-3xl font-black text-white mb-2">Quelles dates ?</h1>
              <p className="text-muted-foreground">Tape les dates possibles pour ton plan</p>
            </div>

            {/* Month picker */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(m => addMonths(m, -1))}
                className="w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center hover:border-primary/50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-base font-bold text-white capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: fr })}
              </span>
              <button
                onClick={() => setCurrentMonth(m => addMonths(m, 1))}
                className="w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center hover:border-primary/50 transition-colors rotate-180"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
              {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map(d => (
                <div key={d} className="text-center text-xs font-bold text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={format(currentMonth, "yyyy-MM")}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
                className="grid grid-cols-7 gap-1 mb-4"
              >
                {Array.from({ length: adjustedFirstDow }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                  const isSelected = selectedDates.some(x => isSameDay(x, d))
                  const isPast = d < new Date(new Date().setHours(0,0,0,0))
                  return (
                    <motion.button
                      key={day}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => !isPast && toggleDate(day)}
                      disabled={isPast}
                      className={`aspect-square rounded-2xl text-sm font-bold flex items-center justify-center transition-all ${
                        isSelected
                          ? "text-white neon-shadow-primary"
                          : isPast
                          ? "text-muted/40 cursor-not-allowed"
                          : "bg-card border border-card-border text-muted-foreground hover:border-primary/40 hover:text-white"
                      }`}
                      style={isSelected ? {
                        background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
                        border: "none",
                      } : undefined}
                    >
                      {day}
                    </motion.button>
                  )
                })}
              </motion.div>
            </AnimatePresence>

            {/* Selected summary */}
            {selectedDates.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 px-4 py-3 rounded-2xl bg-primary/10 border border-primary/20"
              >
                <p className="text-sm text-primary font-medium">
                  {selectedDates.length} date{selectedDates.length > 1 ? "s" : ""} sélectionnée{selectedDates.length > 1 ? "s" : ""} ✨
                </p>
              </motion.div>
            )}

            <div className="mt-auto pt-4">
              <Button
                className="w-full h-14 text-lg rounded-full"
                disabled={selectedDates.length === 0}
                onClick={() => setStep(3)}
              >
                Continuer →
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: Name + emoji ── */}
        {step === 3 && (
          <motion.div
            key="step3"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-8">
              <h1 className="text-3xl font-black text-white mb-2">Nom du plan</h1>
              <p className="text-muted-foreground">Donne un nom et une vibe à ton événement</p>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
              <div className="space-y-8 flex-1">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-primary uppercase tracking-wider">
                    C'est quoi le mood ?
                  </label>
                  <Input
                    placeholder="Ex: Soirée raclette, Anniv de Lucas..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-lg h-16 bg-card border-card-border"
                    autoFocus
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-secondary uppercase tracking-wider">
                    Choisis l'icône
                  </label>
                  <div className="grid grid-cols-5 gap-3">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEmoji(e)}
                        className={`aspect-square text-3xl rounded-2xl flex items-center justify-center transition-all ${
                          emoji === e
                            ? "bg-secondary/20 border-2 border-secondary scale-110 neon-shadow-secondary z-10"
                            : "bg-card border-2 border-transparent hover:bg-card/80 opacity-60 hover:opacity-100"
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 pb-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-16 text-lg rounded-full"
                  disabled={!name.trim() || createEvent.isPending}
                >
                  {createEvent.isPending ? <Loader2 className="animate-spin w-6 h-6" /> : "Créer le plan 🚀"}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
        {/* ── STEP 4: Success + Share ── */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex-1 flex flex-col items-center justify-center text-center gap-8 relative"
          >
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
              <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-secondary/15 rounded-full blur-[70px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-6">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
                className="text-8xl"
              >
                {emoji}
              </motion.div>

              <div className="space-y-2">
                <h1 className="text-4xl font-black text-white">C'est prêt ! 🎉</h1>
                <p className="text-xl font-bold" style={{
                  background: "linear-gradient(90deg, #a78bfa, #f472b6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  {name}
                </p>
              </div>

              {/* Share URL pill */}
              <div className="w-full max-w-xs px-4 py-2.5 rounded-2xl bg-card border border-card-border text-sm text-muted-foreground font-mono truncate">
                {shareUrl}
              </div>
            </div>

            {/* CTAs */}
            <div className="relative z-10 w-full space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  size="lg"
                  className="w-full h-16 text-lg rounded-full gap-2"
                  onClick={handleShare}
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
                    boxShadow: "0 0 32px 0 hsla(var(--primary) / 0.45)",
                  }}
                >
                  {copied
                    ? <><Check className="w-5 h-5" /> Lien copié !</>
                    : <>Partager aux potes 📲</>
                  }
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                <Button
                  variant="ghost"
                  className="w-full h-12 text-muted-foreground hover:text-white"
                  onClick={() => setLocation(`/event/${createdShareCode}`)}
                >
                  Voir l'événement →
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
