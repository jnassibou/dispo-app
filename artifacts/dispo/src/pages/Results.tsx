import { useState, useRef, useCallback } from "react"
import { useRoute, Link } from "wouter"
import { motion } from "framer-motion"
import {
  useGetEvent,
  useGetBestSlot,
  useGetActivityMatches,
  useListAvailabilities,
  useListParticipants,
  getGetEventQueryKey,
  getGetBestSlotQueryKey,
  getGetActivityMatchesQueryKey,
  getListAvailabilitiesQueryKey,
  getListParticipantsQueryKey,
} from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, Calendar, Flame, Users, Loader2, Trophy, Copy, Check, Camera, Download } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

const BLOCK_LABELS: Record<string, string> = {
  morning: "Matin",
  afternoon: "Après-midi",
  evening: "Soir",
  night: "Nuit",
}
const BLOCK_EMOJIS: Record<string, string> = {
  morning: "🌅",
  afternoon: "☀️",
  evening: "🌇",
  night: "🌙",
}
const TIME_BLOCKS = ["morning", "afternoon", "evening", "night"]

// ─── Heatmap cell color ──────────────────────────────────────────────────────
function cellStyle(count: number, total: number): React.CSSProperties {
  if (!total || !count) return { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.06)" }
  const r = count / total
  if (r >= 1)
    return {
      background: "linear-gradient(135deg, rgba(167,139,250,0.85), rgba(244,114,182,0.85))",
      borderColor: "rgba(244,114,182,0.6)",
      boxShadow: "0 0 10px rgba(167,139,250,0.4)",
    }
  if (r >= 0.66)
    return { background: "rgba(167,139,250,0.45)", borderColor: "rgba(167,139,250,0.35)" }
  if (r >= 0.33)
    return { background: "rgba(167,139,250,0.22)", borderColor: "rgba(167,139,250,0.18)" }
  return { background: "rgba(167,139,250,0.08)", borderColor: "rgba(167,139,250,0.1)" }
}

// ─── Hidden sticker for html2canvas ─────────────────────────────────────────
interface StickerProps {
  eventName: string
  emoji: string
  date: string
  timeBlock: string
  participantCount: number
  totalParticipants: number
}
function HiddenSticker({ stickerRef, data }: { stickerRef: React.RefObject<HTMLDivElement | null>; data: StickerProps }) {
  return (
    <div
      ref={stickerRef as React.RefObject<HTMLDivElement>}
      style={{
        position: "fixed",
        top: "-9999px",
        left: "-9999px",
        width: "360px",
        height: "640px",
        background: "linear-gradient(160deg, #0d0d18 0%, #1a0a2e 50%, #0d0d18 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        padding: "40px 32px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Top glow */}
      <div style={{
        position: "absolute", top: "-60px", left: "50%", transform: "translateX(-50%)",
        width: "240px", height: "240px",
        background: "radial-gradient(circle, rgba(167,139,250,0.35) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      {/* Bottom glow */}
      <div style={{
        position: "absolute", bottom: "-60px", right: "-40px",
        width: "200px", height: "200px",
        background: "radial-gradient(circle, rgba(244,114,182,0.25) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Branding */}
      <div style={{ position: "absolute", top: "28px", width: "100%", textAlign: "center" }}>
        <span style={{ fontSize: "14px", fontWeight: 700, color: "rgba(167,139,250,0.8)", letterSpacing: "3px", textTransform: "uppercase" }}>
          ✌️ DISPO ?
        </span>
      </div>

      {/* Content */}
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: "80px", lineHeight: 1, marginBottom: "20px" }}>{data.emoji}</div>
        <div style={{
          fontSize: "30px", fontWeight: 900, color: "#ffffff",
          marginBottom: "12px", lineHeight: 1.1,
          textShadow: "0 0 20px rgba(167,139,250,0.5)",
        }}>
          {data.eventName}
        </div>
        <div style={{
          display: "inline-block",
          padding: "6px 18px",
          borderRadius: "999px",
          background: "linear-gradient(135deg, rgba(167,139,250,0.3), rgba(244,114,182,0.3))",
          border: "1px solid rgba(244,114,182,0.4)",
          marginBottom: "20px",
        }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(244,114,182,1)" }}>
            {data.date} · {data.timeBlock}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <span style={{ fontSize: "24px" }}>👯</span>
          <span style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff" }}>
            {data.participantCount}/{data.totalParticipants} dispos
          </span>
        </div>
        <div style={{ marginTop: "28px", fontSize: "15px", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
          C'est validé, on se capte ! ✨
        </div>
      </div>

      {/* Bottom decoration */}
      <div style={{ position: "absolute", bottom: "24px", width: "100%", textAlign: "center" }}>
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", letterSpacing: "2px" }}>DISPO-APP.COM</span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Results() {
  const [, params] = useRoute("/event/:shareCode/results")
  const shareCode = params?.shareCode || ""

  const [textCopied, setTextCopied] = useState(false)
  const [stickerLoading, setStickerLoading] = useState(false)
  const stickerRef = useRef<HTMLDivElement | null>(null)

  const { data: event } = useGetEvent(shareCode, {
    query: { enabled: !!shareCode, queryKey: getGetEventQueryKey(shareCode) },
  })

  const mode = event?.mode ?? "both"
  const showDates = mode === "date" || mode === "both"
  const showActivities = mode === "activity" || mode === "both"

  const { data: bestSlot, isLoading: slotLoading } = useGetBestSlot(shareCode, {
    query: { enabled: !!shareCode && showDates, queryKey: getGetBestSlotQueryKey(shareCode) },
  })
  const { data: activityMatches, isLoading: activitiesLoading } = useGetActivityMatches(shareCode, {
    query: { enabled: !!shareCode && showActivities, queryKey: getGetActivityMatchesQueryKey(shareCode) },
  })
  const { data: availabilities } = useListAvailabilities(shareCode, {
    query: { enabled: !!shareCode && showDates, queryKey: getListAvailabilitiesQueryKey(shareCode) },
  })
  const { data: participants } = useListParticipants(shareCode, {
    query: { enabled: !!shareCode, queryKey: getListParticipantsQueryKey(shareCode) },
  })

  const isLoading = (showDates && slotLoading) || (showActivities && activitiesLoading)

  // Build heatmap lookup: "date|timeBlock" → count
  const heatMap: Record<string, number> = {}
  for (const slot of availabilities ?? []) {
    const k = `${slot.date}|${slot.timeBlock}`
    heatMap[k] = (heatMap[k] ?? 0) + 1
  }
  const totalPax = participants?.length ?? 0

  // ── Text sticker copy ────────────────────────────────────────────────────────
  const handleCopyText = async () => {
    if (!bestSlot?.date) return
    const dateStr = format(new Date(bestSlot.date), "EEEE d MMMM", { locale: fr })
    const timeStr = bestSlot.timeBlock ? BLOCK_LABELS[bestSlot.timeBlock] ?? bestSlot.timeBlock : ""
    const top = activityMatches?.[0]
    const lines = [
      `✌️ ${event?.name ?? "Notre plan"}`,
      `📅 ${dateStr} - ${timeStr}`,
      `👯 ${bestSlot.participantCount}/${bestSlot.totalParticipants} dispos !`,
      top ? `🔥 On fait : ${top.emoji} ${top.name}` : null,
      `C'est validé, on se capte ! ✨`,
    ]
      .filter(Boolean)
      .join("\n")
    try {
      await navigator.clipboard.writeText(lines)
    } catch {
      const el = document.createElement("textarea")
      el.value = lines
      el.style.cssText = "position:fixed;opacity:0"
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
    }
    setTextCopied(true)
    setTimeout(() => setTextCopied(false), 2500)
  }

  // ── Image sticker (html2canvas) ──────────────────────────────────────────────
  const handleStickerImage = useCallback(async () => {
    if (!stickerRef.current || !bestSlot?.date) return
    setStickerLoading(true)
    try {
      const { default: html2canvas } = await import("html2canvas")
      const canvas = await html2canvas(stickerRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      })
      canvas.toBlob(async (blob) => {
        if (!blob) { setStickerLoading(false); return }
        const file = new File([blob], "dispo-sticker.png", { type: "image/png" })
        // Try native share with file (mobile)
        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: event?.name ?? "Dispo ?" })
            setStickerLoading(false)
            return
          } catch (err) {
            if (err instanceof Error && err.name === "AbortError") {
              setStickerLoading(false)
              return
            }
          }
        }
        // Fallback: trigger download
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "dispo-sticker.png"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setStickerLoading(false)
      }, "image/png")
    } catch {
      setStickerLoading(false)
    }
  }, [bestSlot, event])

  const stickerData: StickerProps | null =
    bestSlot?.date
      ? {
          eventName: event?.name ?? "",
          emoji: event?.emoji ?? "🎉",
          date: format(new Date(bestSlot.date), "EEE d MMM", { locale: fr }),
          timeBlock: bestSlot.timeBlock ? BLOCK_LABELS[bestSlot.timeBlock] ?? bestSlot.timeBlock : "",
          participantCount: bestSlot.participantCount,
          totalParticipants: bestSlot.totalParticipants,
        }
      : null

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-background">
      {/* Hidden sticker for html2canvas */}
      {stickerData && <HiddenSticker stickerRef={stickerRef} data={stickerData} />}

      {/* Sticky header */}
      <div className="p-4 flex items-center border-b border-card-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <Link href={`/event/${shareCode}`}>
          <Button variant="ghost" size="icon" className="rounded-full mr-2">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Le Verdict 🏆</h1>
      </div>

      {isLoading ? (
        <div className="flex-1 flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="p-6 space-y-8 flex-1 overflow-auto pb-24">

          {/* ── Best slot + Top 3 podium ── */}
          {showDates && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Meilleur créneau
              </h2>

              {bestSlot?.date ? (
                <>
                  {/* #1 winner card */}
                  <Card className="p-6 border-primary/30 relative overflow-hidden mb-4">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col gap-2">
                      <div className="text-3xl font-black text-white capitalize">
                        {format(new Date(bestSlot.date), "EEEE d MMMM", { locale: fr })}
                      </div>
                      <div className="text-xl font-bold text-primary flex items-center gap-2">
                        {bestSlot.timeBlock && BLOCK_EMOJIS[bestSlot.timeBlock]}{" "}
                        {bestSlot.timeBlock ? BLOCK_LABELS[bestSlot.timeBlock] ?? bestSlot.timeBlock : ""}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="font-bold">{bestSlot.participantCount} / {bestSlot.totalParticipants} dispos</span>
                        </div>
                        {bestSlot.hasMatch ? (
                          <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full border border-yellow-500/30 font-bold text-sm">
                            <Trophy className="w-4 h-4" /> Parfait 🏆
                          </div>
                        ) : bestSlot.absentNames && bestSlot.absentNames.length > 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Tout le monde est dispo sauf{" "}
                            <span className="text-white font-semibold">{bestSlot.absentNames.join(", ")}</span> 😅
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </Card>

                  {/* Top 2 & 3 runner-up chips */}
                  {bestSlot.topSlots && bestSlot.topSlots.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                      {bestSlot.topSlots.slice(1).map((slot, idx) => (
                        <div
                          key={`${slot.date}|${slot.timeBlock}`}
                          className="flex-shrink-0 px-4 py-3 rounded-2xl bg-card border border-card-border min-w-[140px]"
                        >
                          <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">
                            #{idx + 2}
                          </div>
                          <div className="text-sm font-bold text-white capitalize">
                            {format(new Date(slot.date), "EEE d MMM", { locale: fr })}
                          </div>
                          <div className="text-xs text-primary mt-0.5 flex items-center gap-1">
                            {BLOCK_EMOJIS[slot.timeBlock]} {BLOCK_LABELS[slot.timeBlock] ?? slot.timeBlock}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {slot.participantCount}/{bestSlot.totalParticipants}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Card className="p-6 border-dashed border-card-border bg-transparent">
                  <p className="text-muted-foreground text-center">Pas encore de dispo remplie. Invitez plus de monde !</p>
                </Card>
              )}
            </motion.div>
          )}

          {/* ── Heatmap ── */}
          {showDates && event?.dates && event.dates.length > 0 && totalPax > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Carte des dispos
              </h2>
              <Card className="p-4 border-card-border overflow-x-auto">
                <table className="w-full text-xs" style={{ borderCollapse: "separate", borderSpacing: "3px" }}>
                  <thead>
                    <tr>
                      <th className="text-left text-muted-foreground font-medium pr-2 pb-1 whitespace-nowrap w-20" />
                      {TIME_BLOCKS.map(tb => (
                        <th key={tb} className="text-center text-muted-foreground font-bold pb-1 px-1">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-base">{BLOCK_EMOJIS[tb]}</span>
                            <span className="text-[10px]">{BLOCK_LABELS[tb].split("-")[0].trim().slice(0, 5)}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {event.dates.map(date => (
                      <tr key={date}>
                        <td className="text-muted-foreground font-medium pr-2 py-0.5 whitespace-nowrap text-[11px]">
                          {format(new Date(date), "EEE d", { locale: fr })}
                        </td>
                        {TIME_BLOCKS.map(tb => {
                          const count = heatMap[`${date}|${tb}`] ?? 0
                          const style = cellStyle(count, totalPax)
                          return (
                            <td key={tb} className="py-0.5">
                              <div
                                className="w-full aspect-square rounded-lg border flex items-center justify-center text-[10px] font-bold text-white/70"
                                style={{ minWidth: "36px", minHeight: "36px", ...style }}
                              >
                                {count > 0 ? count : ""}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block" style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.85), rgba(244,114,182,0.85))" }} />Tout le monde</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block bg-purple-500/40" />Partiel</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block bg-white/5 border border-white/10" />Personne</span>
                </div>
              </Card>
            </motion.div>
          )}

          {/* ── Top activities ── */}
          {showActivities && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <h2 className="text-sm font-bold text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                <Flame className="w-4 h-4" /> Top activités
              </h2>
              {activityMatches && activityMatches.length > 0 ? (
                <div className="space-y-3">
                  {activityMatches.slice(0, 3).map((activity, i) => (
                    <Card key={activity.activityId} className={`p-4 flex items-center gap-4 ${i === 0 ? "border-secondary/30" : "border-card-border"}`}>
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
          )}

          {/* ── Share buttons ── */}
          {bestSlot?.date && showDates && (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Image sticker button */}
              <Button
                onClick={handleStickerImage}
                disabled={stickerLoading}
                className="w-full h-14 text-base font-bold gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 border-0"
              >
                {stickerLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <><Camera className="w-5 h-5" /> Partager le Sticker 📸</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Génère une image pour ta story Insta ou Snap 🔥
              </p>

              {/* Text copy fallback */}
              <Button
                variant="outline"
                onClick={handleCopyText}
                className="w-full h-12 text-sm font-medium gap-2 border-card-border"
              >
                {textCopied ? (
                  <><Check className="w-4 h-4 text-green-400" /> Copié !</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copier le résumé texte</>
                )}
              </Button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
