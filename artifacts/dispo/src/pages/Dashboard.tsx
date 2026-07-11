import { Link, useLocation } from "wouter"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useMyEvents } from "@/hooks/use-my-events"
import { CalendarDays, Flame, Sparkles, PlusCircle, LogOut, Trophy } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

const USER_KEY = "dispo_user_email"

const MODE_LABELS: Record<string, string> = {
  date: "🗓️ Date",
  activity: "🎯 Activité",
  both: "🔥 Date + Activité",
}

export default function Dashboard() {
  const [, setLocation] = useLocation()
  const { events } = useMyEvents()

  const userEmail = (() => {
    try { return localStorage.getItem(USER_KEY) } catch { return null }
  })()

  const handleLogout = () => {
    try { localStorage.removeItem(USER_KEY) } catch {}
    setLocation("/login")
  }

  return (
    <div className="min-h-[100dvh] w-full pb-24 bg-background">
      {/* Top header section */}
      <div className="p-6 pt-12 pb-8 bg-card border-b border-card-border relative overflow-hidden">
        <div className="absolute top-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-[60px]" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-[50px]" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Bienvenue 👋</p>
            <h1 className="text-2xl font-black text-white truncate max-w-[220px]">
              {userEmail ?? "Invité"}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Create CTA */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Link href="/create">
            <Button
              className="w-full h-16 text-lg font-bold rounded-2xl gap-3"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))", boxShadow: "0 0 32px 0 hsla(var(--primary) / 0.35)" }}
            >
              <PlusCircle className="w-6 h-6" />
              Créer un événement 🚀
            </Button>
          </Link>
        </motion.div>

        {/* Premium banner */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-5 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/15 rounded-full blur-[40px]" />
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Dispo Max ✨</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">Débloque les supers pouvoirs</h3>
                  <p className="text-xs text-muted-foreground">Rappels auto, stats avancées, stickers personnalisés…</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 h-9 rounded-xl text-xs font-bold bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 transition-colors">
                  1,99€ One-Shot
                </button>
                <button className="flex-1 h-9 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-colors">
                  4,99€ Pass Saison 🏆
                </button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Events list */}
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Mes événements en cours
          </h2>

          {events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-center py-12 space-y-3"
            >
              <div className="text-5xl">🕹️</div>
              <p className="text-muted-foreground text-sm">Aucun événement pour l'instant</p>
              <p className="text-xs text-muted-foreground/60">Crée ton premier plan et invites tes potes</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {events.map((ev, i) => (
                <motion.div
                  key={ev.shareCode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06 }}
                >
                  <Link href={`/event/${ev.shareCode}`}>
                    <Card className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer border-card-border">
                      <div className="text-3xl w-12 h-12 flex items-center justify-center rounded-2xl bg-card shrink-0">
                        {ev.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-white truncate">{ev.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{MODE_LABELS[ev.mode] ?? ev.mode}</span>
                          <span className="text-xs text-muted-foreground/40">·</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(ev.createdAt), { addSuffix: true, locale: fr })}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-1">
                        {ev.mode !== "activity" && <CalendarDays className="w-3.5 h-3.5 text-primary/60" />}
                        {ev.mode !== "date" && <Flame className="w-3.5 h-3.5 text-secondary/60" />}
                        <Trophy className="w-3.5 h-3.5 text-accent/60" />
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
