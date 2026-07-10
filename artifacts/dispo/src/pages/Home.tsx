import { Link } from "wouter"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        className="z-10 flex flex-col items-center text-center space-y-8 max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.15 }}
            className="text-7xl"
          >
            🎉
          </motion.div>
          <h1 className="text-4xl font-black tracking-tight text-white">
            L'orga de soirées,<br />
            <span className="neon-text-primary" style={{
              background: "linear-gradient(90deg, #a78bfa, #f472b6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              sans les prises de tête.
            </span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Trouve la date parfaite et l'activité qui cartonne — en 2 min chrono. ✨
          </p>
        </div>

        <Link href="/create" className="w-full">
          <Button size="lg" className="w-full text-lg h-16 rounded-full">
            Créer un événement 🚀
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}
