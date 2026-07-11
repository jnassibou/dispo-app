import { Link, useLocation } from "wouter"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useMyEvents } from "@/hooks/use-my-events"
import {
  CalendarDays, Flame, Sparkles, PlusCircle, LogOut,
  Trophy, Clock, CheckCircle2, Users, Zap,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

const USER_KEY = "dispo_user_email"

const MODE_LABELS: Record<string, string> = {
  date: "🗓️ Date",
  activity: "🎯 Activité",
  both: "🔥 Date + Activité",
}

// ─── Static mock events always shown for demo ───────────────────────────────
const MOCK_EVENTS = [
  {
    shareCode: "__mock_dam",
    name: "Bouffe chez Dam 🍕",
    emoji: "🍕",
    mode: "both",
    status: "ongoing",
    participants: 6,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    shareCode: "__mock_ericka",
    name: "Anniv Ericka 🎂",
    emoji: "🎂",
    mode: "date",
    status: "validated",
    participants: 11,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
]

function StatusBadge({ status }: { status: string }) {
  if (status === "validated") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">
        <CheckCircle2 className="w-2.5 h-2.5" />
        Validé
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5">
      <Clock className="w-2.5 h-2.5" />
      En cours
    </span>
  )
}

export default function Dashboard() {
  const [, setLocation] = useLocation()
  const { events } = useMyEvents()

  const userEmail = (() => {
    try { return localStorage.getItem(USER_KEY) } catch { return null }
  })()

  const displayName = userEmail
    ? userEmail.split("@")[0].replace(/[._]/g, " ")
    : "Invité"

  const handleLogout = () => {
    try { localStorage.removeItem(USER_KEY) } catch {}
    setLocation("/login")
  }

  // Combine real events + mock events (mock ones at the end)
  const allEvents = [...events, ...MOCK_EVENTS]

  return (
    <div className="min-h-[100dvh] w-full pb-32 bg-background">

      {/* ── Hero header ────────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-7 bg-card border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-56 h-56 bg-primary/15 rounded-full blur-[70px]" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-secondary/15 rounded-full blur-[60px]" />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">Bienvenue 👋</p>
            <h1 className="text-2xl font-black text-white truncate capitalize">
              {displayName}
            </h1>
            {userEmail && (
              <p className="text-xs text-muted-foreground/60 truncate mt-0.5">{userEmail}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-10 h-10 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
            aria-label="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-6">

        {/* ── Premium banner ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          {/* Gradient border wrapper */}
          <div
            className="rounded-3xl p-px"
            style={{
              background: "linear-gradient(135deg, #f59e0b, #a78bfa, #ec4899)",
            }}
          >
            <div className="rounded-[calc(1.5rem-1px)] bg-[#0f0a1e] px-5 py-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[50px]" />
              <div className="absolute bottom-0 left-0 w-28 h-28 bg-purple-500/10 rounded-full blur-[50px]" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span
                    className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-amber-400 to-pink-400 bg-clip-text text-transparent"
                  >
                    Dispo Max 🌟
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mb-1">Passe à Dispo Max 🌟</h3>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  Invités illimités, sondages secrets, thèmes exclusifs.
                </p>
                <div className="flex gap-2">
                  {/* One-shot */}
                  <button
                    className="flex-1 h-10 rounded-xl text-xs font-bold border transition-all active:scale-95"
                    style={{
                      background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(167,139,250,0.15))",
                      borderColor: "rgba(245,158,11,0.4)",
                      color: "#fbbf24",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "linear-gradient(135deg, rgba(245,158,11,0.28), rgba(167,139,250,0.22))")}
                    onMouseLeave={e => (e.currentTarget.style.background = "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(167,139,250,0.15))")}
                  >
                    1,99€ (L'Event)
                  </button>
                  {/* Pass saison */}
                  <button
                    className="flex-1 h-10 rounded-xl text-xs font-black transition-all active:scale-95"
                    style={{
                      background: "linear-gradient(135deg, #f59e0b, #a78bfa)",
                      color: "#0f0a1e",
                      boxShadow: "0 0 20px 0 rgba(245,158,11,0.35)",
                    }}
                  >
                    4,99€ (Pass Saison)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Events list ────────────────────────────────────────── */}
        <div>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
            Mes événements
          </h2>

          <div className="space-y-2.5">
            {allEvents.map((ev, i) => {
              const isMock = ev.shareCode.startsWith("__mock_")
              const mockEv = ev as typeof MOCK_EVENTS[0] & typeof events[0]

              return (
                <motion.div
                  key={ev.shareCode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                >
                  {isMock ? (
                    // Mock event card (non-interactive hint)
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                      <div className="text-2xl w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 shrink-0">
                        {mockEv.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-bold text-white truncate">{mockEv.name}</h3>
                          <StatusBadge status={mockEv.status} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{MODE_LABELS[mockEv.mode] ?? mockEv.mode}</span>
                          <span className="text-muted-foreground/30 text-xs">·</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" /> {mockEv.participants}
                          </span>
                          <span className="text-muted-foreground/30 text-xs">·</span>
                          <span className="text-xs text-muted-foreground/60">
                            {formatDistanceToNow(new Date(mockEv.createdAt), { addSuffix: true, locale: fr })}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-1">
                        {mockEv.mode !== "activity" && <CalendarDays className="w-3.5 h-3.5 text-primary/50" />}
                        {mockEv.mode !== "date" && <Flame className="w-3.5 h-3.5 text-secondary/50" />}
                        {mockEv.status === "validated" && <Trophy className="w-3.5 h-3.5 text-amber-400/70" />}
                      </div>
                    </div>
                  ) : (
                    <Link href={`/event/${ev.shareCode}`}>
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] active:scale-[0.98] transition-all cursor-pointer">
                        <div className="text-2xl w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 shrink-0">
                          {(ev as typeof events[0]).emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-sm font-bold text-white truncate">{ev.name}</h3>
                            <StatusBadge status="ongoing" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{MODE_LABELS[ev.mode] ?? ev.mode}</span>
                            <span className="text-muted-foreground/30 text-xs">·</span>
                            <span className="text-xs text-muted-foreground/60">
                              {formatDistanceToNow(new Date(ev.createdAt), { addSuffix: true, locale: fr })}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-1">
                          {ev.mode !== "activity" && <CalendarDays className="w-3.5 h-3.5 text-primary/50" />}
                          {ev.mode !== "date" && <Flame className="w-3.5 h-3.5 text-secondary/50" />}
                        </div>
                      </div>
                    </Link>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Floating CTA ───────────────────────────────────────────── */}
      <div className="fixed bottom-6 left-0 right-0 z-50 px-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 20 }}
          className="pointer-events-auto"
        >
          <Link href="/create">
            <Button
              className="w-full h-14 text-base font-black rounded-2xl gap-2.5 shadow-2xl"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
                boxShadow: "0 8px 40px 0 hsla(var(--primary) / 0.5), 0 2px 8px 0 rgba(0,0,0,0.6)",
              }}
            >
              <PlusCircle className="w-5 h-5" />
              Créer un événement 🚀
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
