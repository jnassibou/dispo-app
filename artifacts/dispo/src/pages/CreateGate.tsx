import { useEffect } from "react"
import { useLocation } from "wouter"
import { motion } from "framer-motion"
import { Sparkles, UserCircle2, Ghost } from "lucide-react"
import { getStoredUser } from "./Login"

const NEXT = "/create/new"

export default function CreateGate() {
  const [, setLocation] = useLocation()

  // Already logged in → skip gate
  useEffect(() => {
    if (getStoredUser()) setLocation(NEXT, { replace: true })
  }, [setLocation])

  // Logged-in users are redirected above; just render gate for guests
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Glows */}
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        className="w-full max-w-sm z-10 flex flex-col items-center gap-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div
            className="text-6xl"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 12, delay: 0.08 }}
          >
            🚀
          </motion.div>
          <h1 className="text-3xl font-black text-white leading-tight">
            Créer un event
          </h1>
          <p className="text-muted-foreground text-sm">
            Connecte-toi pour retrouver tes events plus tard,<br />
            ou lance-toi direct en invité.
          </p>
        </div>

        {/* Options */}
        <div className="w-full flex flex-col gap-3">

          {/* Login option */}
          <motion.button
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => setLocation(`/login?next=${encodeURIComponent(NEXT)}`)}
            className="w-full flex items-center gap-4 px-5 h-[72px] rounded-2xl text-left transition-all active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary) / 0.18), hsl(var(--secondary) / 0.12))",
              border: "1px solid hsl(var(--primary) / 0.35)",
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
            >
              <UserCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Se connecter</p>
              <p className="text-xs text-muted-foreground">Lien magique · Retrouve tous tes events</p>
            </div>
            <Sparkles className="w-4 h-4 text-primary/60 ml-auto shrink-0" />
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-3 px-1">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-muted-foreground/50 font-medium">ou</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Guest option */}
          <motion.button
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setLocation(NEXT)}
            className="w-full flex items-center gap-4 px-5 h-[72px] rounded-2xl text-left border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] transition-all active:scale-[0.97]"
          >
            <div className="w-11 h-11 rounded-xl bg-white/8 flex items-center justify-center shrink-0">
              <Ghost className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Continuer en invité</p>
              <p className="text-xs text-muted-foreground">Sans compte · Accès via le lien uniquement</p>
            </div>
          </motion.button>

        </div>

        <p className="text-xs text-muted-foreground/50 text-center">
          Pas de spam. Pas de mot de passe. Jamais. ✨
        </p>
      </motion.div>
    </div>
  )
}
