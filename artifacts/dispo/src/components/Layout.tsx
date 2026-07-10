import { Link } from "wouter"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-[100dvh] w-full">
      {/* Global sticky header */}
      <header className="sticky top-0 z-[100] flex items-center justify-center h-14 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <Link href="/">
          <span className="text-xl font-black tracking-tight select-none" style={{
            background: "linear-gradient(90deg, #a78bfa, #f472b6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "none",
            filter: "drop-shadow(0 0 8px rgba(167,139,250,0.6))",
          }}>
            ✌️ Dispo ?
          </span>
        </Link>
      </header>

      {/* Page content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
