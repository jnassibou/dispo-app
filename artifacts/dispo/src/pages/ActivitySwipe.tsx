import { useState, useEffect } from "react"
import { useRoute, Link, useLocation } from "wouter"
import { motion, AnimatePresence, useAnimation, PanInfo } from "framer-motion"
import { useListActivities, useSubmitActivityVote, getListActivitiesQueryKey } from "@workspace/api-client-react"
import { useParticipant } from "@/hooks/use-participant"
import { Button } from "@/components/ui/button"
import { ChevronLeft, X, Flame, Loader2 } from "lucide-react"

export default function ActivitySwipe() {
  const [match, params] = useRoute("/event/:shareCode/swipe")
  const shareCode = params?.shareCode || ""
  const [, setLocation] = useLocation()
  const { participant } = useParticipant(shareCode)

  const { data: activities, isLoading } = useListActivities(shareCode, {
    query: { enabled: !!shareCode, queryKey: getListActivitiesQueryKey(shareCode) }
  })
  const submitVote = useSubmitActivityVote()

  const [currentIndex, setCurrentIndex] = useState(0)
  
  const currentActivity = activities ? activities[currentIndex] : null
  const isFinished = activities && currentIndex >= activities.length

  const handleVote = (liked: boolean) => {
    if (!currentActivity || !participant) return

    submitVote.mutate({
      shareCode,
      data: {
        participantId: participant.id,
        activityId: currentActivity.id,
        liked
      }
    })

    setCurrentIndex(prev => prev + 1)
  }

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 100
    if (info.offset.x > swipeThreshold) {
      handleVote(true)
    } else if (info.offset.x < -swipeThreshold) {
      handleVote(false)
    }
  }

  if (!participant) {
    setLocation(`/event/${shareCode}`)
    return null
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-background overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-card-border bg-card/50 backdrop-blur-md z-50 relative">
        <div className="flex items-center">
          <Link href={`/event/${shareCode}`}>
            <Button variant="ghost" size="icon" className="rounded-full mr-2">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">On fait quoi ?</h1>
        </div>
        {activities && !isFinished && (
          <div className="text-sm font-bold text-muted-foreground bg-white/5 px-3 py-1 rounded-full">
            {currentIndex + 1} / {activities.length}
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative">
        {isLoading ? (
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        ) : isFinished ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="text-6xl mb-4">🏁</div>
            <h2 className="text-3xl font-black text-white">Tout vu !</h2>
            <p className="text-muted-foreground">T'as voté pour toutes les idées.</p>
            <Link href={`/event/${shareCode}/results`}>
              <Button size="lg" className="h-14 mt-4 w-full">Voir les résultats</Button>
            </Link>
          </motion.div>
        ) : currentActivity ? (
          <div className="w-full max-w-sm aspect-[3/4] relative">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={currentActivity.id}
                className="absolute inset-0 bg-card border border-card-border rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center"
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, transition: { duration: 0.2 } }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.8}
                onDragEnd={handleDragEnd}
                whileDrag={{ cursor: "grabbing" }}
              >
                <div className="text-8xl mb-8 pointer-events-none select-none">{currentActivity.emoji}</div>
                <h2 className="text-4xl font-black text-white mb-2 pointer-events-none select-none">{currentActivity.name}</h2>
                <div className="px-4 py-1.5 rounded-full bg-white/5 text-muted-foreground text-sm font-bold mt-4">
                  {currentActivity.category}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : null}
      </div>

      {!isFinished && activities && (
        <div className="p-8 flex justify-center gap-8 pb-12">
          <Button 
            size="icon" 
            variant="outline" 
            className="w-20 h-20 rounded-full border-2 border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => handleVote(false)}
          >
            <X className="w-10 h-10" />
          </Button>
          <Button 
            size="icon" 
            className="w-20 h-20 rounded-full bg-secondary hover:bg-secondary/90 text-white neon-shadow-secondary"
            onClick={() => handleVote(true)}
          >
            <Flame className="w-10 h-10" />
          </Button>
        </div>
      )}
    </div>
  )
}
