import { Link } from "wouter"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-[100dvh] w-full">
      {/* Global sticky header */}
      <header className="sticky top-0 z-[100] flex items-center justify-center h-14 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <Link href="/">
          <span
            className="text-xl font-black tracking-tight select-none bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent"
            style={{ filter: "drop-shadow(0 0 10px rgba(167,139,250,0.55))" }}
          >
            Dispo ?
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
