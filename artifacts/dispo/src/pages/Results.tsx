import { useRoute, Link } from "wouter"
import { motion } from "framer-motion"
import { useGetBestSlot, useGetActivityMatches, getGetBestSlotQueryKey, getGetActivityMatchesQueryKey } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, Calendar, Flame, Users, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

const BLOCK_LABELS: Record<string, string> = {
  morning: "Matin",
  afternoon: "Après-midi",
  evening: "Soir",
  night: "Nuit"
}

export default function Results() {
  const [match, params] = useRoute("/event/:shareCode/results")
  const shareCode = params?.shareCode || ""

  const { data: bestSlot, isLoading: slotLoading } = useGetBestSlot(shareCode, {
    query: { enabled: !!shareCode, queryKey: getGetBestSlotQueryKey(shareCode) }
  })
  
  const { data: activityMatches, isLoading: activitiesLoading } = useGetActivityMatches(shareCode, {
    query: { enabled: !!shareCode, queryKey: getGetActivityMatchesQueryKey(shareCode) }
  })

  const isLoading = slotLoading || activitiesLoading

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-background">
      <div className="p-4 flex items-center border-b border-card-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <Link href={`/event/${shareCode}`}>
          <Button variant="ghost" size="icon" className="rounded-full mr-2">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Le Verdict 🏆</h1>
      </div>

      {isLoading ? (
        <div className="flex-1 flex justify-center items-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="p-6 space-y-8 flex-1 overflow-auto pb-24">
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Meilleur créneau
            </h2>
            
            {bestSlot?.hasMatch && bestSlot.date ? (
              <Card className="p-6 border-primary/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] pointer-events-none" />
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="text-3xl font-black text-white capitalize">
                    {format(new Date(bestSlot.date), "EEEE d MMMM", { locale: fr })}
                  </div>
                  <div className="text-xl font-bold text-primary">
                    {bestSlot.timeBlock ? BLOCK_LABELS[bestSlot.timeBlock] || bestSlot.timeBlock : ""}
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full w-fit border border-white/10">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-bold">{bestSlot.participantCount} / {bestSlot.totalParticipants} dispos</span>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 border-dashed border-card-border bg-transparent">
                <p className="text-muted-foreground text-center">Pas encore de créneau commun trouvé. Invitez plus de monde !</p>
              </Card>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-sm font-bold text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
              <Flame className="w-4 h-4" /> Top activités
            </h2>
            
            {activityMatches && activityMatches.length > 0 ? (
              <div className="space-y-3">
                {activityMatches.slice(0, 3).map((activity, i) => (
                  <Card key={activity.activityId} className={`p-4 flex items-center gap-4 ${i === 0 ? 'border-secondary/30' : 'border-card-border'}`}>
                    <div className="text-4xl">{activity.emoji}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{activity.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Flame className="w-3 h-3 text-secondary" />
                        {activity.likeCount} likes
                      </p>
                    </div>
                    {i === 0 && (
                      <div className="w-10 h-10 rounded-full bg-secondary/20 text-secondary flex items-center justify-center font-black">
                        #1
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 border-dashed border-card-border bg-transparent">
                <p className="text-muted-foreground text-center">Les votes sont encore en cours. Swipez !</p>
              </Card>
            )}
          </motion.div>

        </div>
      )}
    </div>
  )
}
