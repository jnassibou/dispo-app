import { Link, useLocation } from "wouter"
import { Home, UserCircle2 } from "lucide-react"

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()

  // Don't show profile icon on the dashboard/login itself to avoid clutter
  const onDashboard = location === "/dashboard"
  const onLogin = location === "/login"

  return (
    <div className="flex flex-col min-h-[100dvh] w-full">
      {/* Global sticky header */}
      <header className="sticky top-0 z-[100] flex items-center h-14 px-4 bg-background/80 backdrop-blur-xl border-b border-white/5">

        {/* Left: Home icon (only away from dashboard) */}
        <div className="w-10">
          {!onDashboard && !onLogin && (
            <Link href="/dashboard">
              <button
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/8 text-muted-foreground hover:text-white transition-colors"
                aria-label="Tableau de bord"
              >
                <Home className="w-4 h-4" />
              </button>
            </Link>
          )}
        </div>

        {/* Center: Logo */}
        <div className="flex-1 flex justify-center">
          <Link href="/">
            <span
              className="text-xl font-black tracking-tight select-none bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent"
              style={{ filter: "drop-shadow(0 0 10px rgba(167,139,250,0.55))" }}
            >
              Dispo ?
            </span>
          </Link>
        </div>

        {/* Right: Profile icon */}
        <div className="w-10 flex justify-end">
          {!onDashboard && !onLogin && (
            <Link href="/dashboard">
              <button
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/8 text-muted-foreground hover:text-white transition-colors"
                aria-label="Mon profil"
              >
                <UserCircle2 className="w-4 h-4" />
              </button>
            </Link>
          )}
        </div>

      </header>

      {/* Page content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
