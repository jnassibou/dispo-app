import { useState } from "react"
import { useLocation, useSearch } from "wouter"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Sparkles, Loader2, CheckCircle2 } from "lucide-react"

const USER_KEY = "dispo_user_email"

export function getStoredUser(): string | null {
  try { return localStorage.getItem(USER_KEY) } catch { return null }
}

export default function Login() {
  const [, setLocation] = useLocation()
  const search = useSearch()
  const nextParam = new URLSearchParams(search).get("next") ?? "/dashboard"

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSent(true)
      // Simulate clicking the magic link after 2s → redirect to next
      setTimeout(() => {
        localStorage.setItem(USER_KEY, email.trim())
        setLocation(nextParam)
      }, 2000)
    }, 1200)
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/25 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-secondary/25 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        className="w-full max-w-sm z-10 space-y-10"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Logo */}
        <div className="text-center space-y-4">
          <motion.div
            className="text-6xl"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 12, delay: 0.1 }}
          >
            ✌️
          </motion.div>
          <div>
            <h1 className="text-3xl font-black text-white leading-tight">
              Retrouve tes events.
            </h1>
            <h1
              className="text-3xl font-black leading-tight bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent"
              style={{ filter: "drop-shadow(0 0 14px rgba(167,139,250,0.4))" }}
            >
              Zéro mot de passe.
            </h1>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Ton adresse email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-14 pl-12 text-base bg-white/5 border-white/10 focus:border-primary/60 rounded-2xl"
                  autoFocus
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full h-14 text-base font-bold rounded-2xl gap-2"
                disabled={!email.trim() || loading}
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
                  boxShadow: "0 0 36px 0 hsla(var(--primary) / 0.4)",
                }}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <><Sparkles className="w-5 h-5" /> Recevoir mon lien magique ✨</>
                )}
              </Button>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.88, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="text-center space-y-5 rounded-3xl p-8 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(236,72,153,0.08))",
                border: "1px solid rgba(167,139,250,0.25)",
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
              >
                <CheckCircle2 className="w-14 h-14 mx-auto text-green-400" style={{ filter: "drop-shadow(0 0 12px rgba(74,222,128,0.6))" }} />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Lien envoyé !</h2>
                <p className="text-muted-foreground text-sm">
                  Check ta boîte{" "}
                  <span className="text-white font-semibold">{email}</span>
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-white/5 rounded-full px-4 py-2 w-fit mx-auto">
                <Loader2 className="w-3 h-3 animate-spin" />
                Connexion automatique dans 2s…
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-muted-foreground/70">
          Pas de mot de passe. Pas de prise de tête. ✨
        </p>
      </motion.div>
    </div>
  )
}
