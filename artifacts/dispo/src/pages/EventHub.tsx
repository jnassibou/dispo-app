import { useState } from "react"
import { useRoute, Link, useLocation } from "wouter"
import { motion } from "framer-motion"
import { useGetEvent, useListParticipants, useJoinEvent, getGetEventQueryKey, getListParticipantsQueryKey } from "@workspace/api-client-react"
import { useParticipant } from "@/hooks/use-participant"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { CalendarDays, Flame, Trophy, Users, Loader2, Link2 } from "lucide-react"

export default function EventHub() {
  const [match, params] = useRoute("/event/:shareCode")
  const shareCode = params?.shareCode || ""
  const [, setLocation] = useLocation()

  const { data: event, isLoading: eventLoading } = useGetEvent(shareCode, {
    query: { enabled: !!shareCode, queryKey: getGetEventQueryKey(shareCode) }
  })
  
  const { data: participants } = useListParticipants(shareCode, {
    query: { enabled: !!shareCode, queryKey: getListParticipantsQueryKey(shareCode) }
  })

  const { participant, saveParticipant } = useParticipant(shareCode)
  const joinEvent = useJoinEvent()
  const [joinName, setJoinName] = useState("")
  const [copied, setCopied] = useState(false)

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinName.trim()) return
    joinEvent.mutate(
      { shareCode, data: { name: joinName } },
      { onSuccess: (p) => saveParticipant(p.id, p.name) }
    )
  }

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      // Fallback for older browsers
      const el = document.createElement("textarea")
      el.value = text
      el.style.position = "fixed"
      el.style.opacity = "0"
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
    }
  }

  const handleInvite = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: event?.name || "Dispo ?", url })
        return
      } catch (err: unknown) {
        // If user cancelled (AbortError), do nothing; otherwise fall through to clipboard
        if (err instanceof Error && err.name === "AbortError") return
      }
    }
    try {
      await copyToClipboard(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // clipboard unavailable — nothing we can do silently
    }
  }

  if (eventLoading) {
    return <div className="min-h-[100dvh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  if (!event) {
    return <div className="min-h-[100dvh] flex items-center justify-center p-6 text-center">Événement introuvable 🕵️‍♂️</div>
  }

  const mode = event.mode || "both"
  const showDates = mode === "date" || mode === "both"
  const showActivities = mode === "activity" || mode === "both"

  // If not joined, show join screen
  if (!participant) {
    return (
      <div className="min-h-[100dvh] w-full p-6 flex flex-col items-center justify-center">
        <motion.div 
          className="w-full max-w-sm space-y-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">{event.emoji}</div>
            <h1 className="text-3xl font-black text-white">{event.name}</h1>
            <p className="text-muted-foreground">Rejoins le plan pour donner tes dispos et voter pour les activités.</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <Input 
              placeholder="Ton prénom / surnom" 
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              className="h-16 text-center text-lg"
              autoFocus
            />
            <Button 
              type="submit" 
              className="w-full h-16 text-lg"
              disabled={!joinName.trim() || joinEvent.isPending}
            >
              {joinEvent.isPending ? <Loader2 className="animate-spin w-6 h-6" /> : "Rejoindre 🎉"}
            </Button>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] w-full pb-24 bg-background">
      {/* Header */}
      <div className="p-6 pt-12 pb-8 bg-card border-b border-card-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px]" />
        
        <div className="relative z-10">
          <div className="text-4xl mb-3">{event.emoji}</div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-tight">{event.name}</h1>
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground font-medium">
            <Users className="w-4 h-4" />
            <span>{participants?.length || 0} participant{(participants?.length || 0) !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {showDates && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Link href={`/event/${shareCode}/availabilities`}>
              <Card className="p-5 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer border-primary/20">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">Disponibilités</h3>
                  <p className="text-sm text-muted-foreground">Quand es-tu chaud ?</p>
                </div>
              </Card>
            </Link>
          </motion.div>
        )}

        {showActivities && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: showDates ? 0.2 : 0.1 }}>
            <Link href={`/event/${shareCode}/swipe`}>
              <Card className="p-5 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer border-secondary/20">
                <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary">
                  <Flame className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">On fait quoi ?</h3>
                  <p className="text-sm text-muted-foreground">Swipe les activités</p>
                </div>
              </Card>
            </Link>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (showDates && showActivities) ? 0.3 : showDates || showActivities ? 0.2 : 0.1 }}>
          <Link href={`/event/${shareCode}/results`}>
            <Card className="p-5 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer border-accent/20">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Résultats</h3>
                <p className="text-sm text-muted-foreground">Découvre le match parfait</p>
              </div>
            </Card>
          </Link>
        </motion.div>
      </div>
      
      {/* Participants list + invite button */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Dans le groupe</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {participants?.map(p => (
            <div key={p.id} className={`px-4 py-2 rounded-full text-sm font-medium ${p.id === participant.id ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-card border border-card-border'}`}>
              {p.name} {p.id === participant.id && "(Toi)"}
            </div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Button
            onClick={handleInvite}
            className="w-full h-14 text-base font-bold gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0"
          >
            <Link2 className="w-5 h-5" />
            {copied ? "Lien copié ! ✓" : "Inviter mes potes 🔗"}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
