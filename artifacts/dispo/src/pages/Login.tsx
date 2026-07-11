import { useState } from "react"
import { useLocation } from "wouter"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Sparkles, Loader2 } from "lucide-react"

const USER_KEY = "dispo_user_email"

export function getStoredUser(): string | null {
  try { return localStorage.getItem(USER_KEY) } catch { return null }
}

export default function Login() {
  const [, setLocation] = useLocation()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    // Mock: simulate "magic link sent" then auto-login
    setTimeout(() => {
      setLoading(false)
      setSent(true)
      // Simulate clicking the link after 1.5s
      setTimeout(() => {
        localStorage.setItem(USER_KEY, email.trim())
        setLocation("/dashboard")
      }, 1500)
    }, 1200)
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        className="w-full max-w-sm z-10 space-y-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Logo */}
        <div className="text-center space-y-3">
          <motion.div
            className="text-6xl"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 12, delay: 0.1 }}
          >
            ✌️
          </motion.div>
          <h1 className="text-4xl font-black text-white">Connexion</h1>
          <p className="text-muted-foreground">
            Reçois un lien magique pour rejoindre ton dashboard.
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="ton@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-14 pl-12 text-base"
                autoFocus
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-14 text-base font-bold rounded-full gap-2"
              disabled={!email.trim() || loading}
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <><Sparkles className="w-5 h-5" /> Recevoir mon lien magique</>
              )}
            </Button>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4 bg-card border border-card-border rounded-3xl p-8"
          >
            <div className="text-5xl">📬</div>
            <h2 className="text-xl font-bold text-white">Lien envoyé !</h2>
            <p className="text-muted-foreground text-sm">
              Vérifie ta boîte <span className="text-white font-medium">{email}</span>
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Connexion automatique…
            </div>
          </motion.div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Pas de mot de passe. Pas de prise de tête. ✨
        </p>
      </motion.div>
    </div>
  )
}
