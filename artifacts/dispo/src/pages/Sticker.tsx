import { useRoute, Link } from "wouter"
import { motion } from "framer-motion"
import { useGetEventSummary, getGetEventSummaryQueryKey } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Download, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

const BLOCK_LABELS: Record<string, string> = {
  morning: "Matin",
  afternoon: "Aprem",
  evening: "Soirée",
  night: "Nuit"
}

export default function Sticker() {
  const [match, params] = useRoute("/event/:shareCode/sticker")
  const shareCode = params?.shareCode || ""

  const { data: summary, isLoading } = useGetEventSummary(shareCode, {
    query: { enabled: !!shareCode, queryKey: getGetEventSummaryQueryKey(shareCode) }
  })

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-black">
      <div className="p-4 flex items-center justify-between z-50 absolute top-0 w-full text-white">
        <Link href={`/event/${shareCode}`}>
          <Button variant="ghost" size="icon" className="rounded-full bg-black/20 backdrop-blur hover:bg-black/40 text-white">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-900 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black">
        {isLoading ? (
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        ) : summary ? (
          <>
            {/* STICKER CONTAINER - The part to screenshot */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-[320px] aspect-[4/5] rounded-[2.5rem] bg-gradient-to-br from-primary via-purple-600 to-secondary p-1 shadow-2xl relative overflow-hidden neon-shadow-primary"
              id="sticker-node"
            >
              <div className="w-full h-full bg-black/40 backdrop-blur-xl rounded-[2.25rem] p-6 flex flex-col relative overflow-hidden border border-white/20">
                {/* Decorative noise/texture could go here */}
                
                <div className="text-center mt-4">
                  <div className="text-6xl mb-4 drop-shadow-2xl">{summary.emoji}</div>
                  <h2 className="text-3xl font-black text-white leading-tight mb-2 tracking-tight">
                    {summary.name}
                  </h2>
                </div>

                <div className="mt-auto space-y-3 mb-4">
                  {summary.bestDate && (
                    <div className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-md">
                      <div className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">On se capte le</div>
                      <div className="text-xl font-black text-white capitalize">
                        {format(new Date(summary.bestDate), "EEEE d MMM", { locale: fr })}
                        {summary.bestTimeBlock ? ` • ${BLOCK_LABELS[summary.bestTimeBlock]}` : ''}
                      </div>
                    </div>
                  )}

                  {summary.topActivity && (
                    <div className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-md flex items-center gap-3">
                      <div className="text-3xl">{summary.topActivityEmoji}</div>
                      <div>
                        <div className="text-xs font-bold text-white/60 uppercase tracking-widest mb-0.5">Pour faire</div>
                        <div className="text-lg font-bold text-white">{summary.topActivity}</div>
                      </div>
                    </div>
                  )}
                  
                  {!summary.bestDate && !summary.topActivity && (
                    <div className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-md text-center">
                      <div className="text-lg font-bold text-white mb-1">Plan en cours...</div>
                      <div className="text-sm text-white/70">Rejoins pour voter !</div>
                    </div>
                  )}
                </div>

                <div className="text-center text-white/40 text-xs font-bold uppercase tracking-widest pb-2">
                  Dispo ? • {summary.participantCount} participant(s)
                </div>
              </div>
            </motion.div>

            <div className="mt-12 text-center">
              <Button size="lg" className="rounded-full h-14 px-8 bg-white text-black hover:bg-white/90">
                <Download className="w-5 h-5 mr-2" />
                Télécharger la Story
              </Button>
              <p className="text-white/50 text-sm mt-4 font-medium">Screenshot pour partager sur Insta/Snap</p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
