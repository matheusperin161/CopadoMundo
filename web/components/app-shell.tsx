"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { BookOpen, RefreshCw, Repeat2, LogOut, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface User {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
}

const NAV_ITEMS = [
  { href: "/colecao", label: "Coleção", icon: BookOpen },
  { href: "/repetidas", label: "Repetidas", icon: Repeat2 },
  { href: "/trocas", label: "Trocas", icon: RefreshCw },
]

export default function AppShell({
  children,
  user,
}: {
  children: React.ReactNode
  user: User
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="min-h-screen bg-[#0A1628] flex">
      {/* ── Sidebar (desktop) ───────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen border-r border-white/10 bg-[#060e1c] fixed left-0 top-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
          <Trophy className="text-[#FFD700]" size={26} />
          <div>
            <p
              className="text-white font-black text-xl leading-none tracking-wider"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              Copa 2026
            </p>
            <p className="text-[#FFD700]/70 text-xs">Álbum de Figurinhas</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-[#FFD700] text-[#0A1628] font-bold shadow-lg shadow-[#FFD700]/20"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
            <Avatar className="size-9">
              <AvatarImage src={user.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-[#FFD700]/20 text-[#FFD700] text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.fullName}</p>
              <p className="text-white/40 text-xs truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/30 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-400/10"
              title="Sair"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────── */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0 min-h-screen">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-4 bg-[#060e1c] border-b border-white/10 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Trophy className="text-[#FFD700]" size={20} />
            <span
              className="text-white font-black text-lg tracking-wider"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              Copa 2026
            </span>
          </div>
          <Avatar className="size-8">
            <AvatarImage src={user.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-[#FFD700]/20 text-[#FFD700] text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="p-4 md:p-8">{children}</div>
      </main>

      {/* ── Bottom nav (mobile) ─────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#060e1c] border-t border-white/10">
        <div className="flex items-center">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-all duration-150",
                  active ? "text-[#FFD700]" : "text-white/40 hover:text-white/70"
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
