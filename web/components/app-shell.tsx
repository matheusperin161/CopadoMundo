"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { Home, BookOpen, Repeat2, RefreshCw, LogOut, Sun, Moon } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { DupesCountProvider, useDupesCount } from "@/components/dupes-count-context"
import { cn } from "@/lib/utils"

interface User {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
}

interface Props {
  children: React.ReactNode
  user: User
  dupesCount?: number
  matchCount?: number
}

const NAV_ITEMS = [
  { href: "/inicio",    label: "Início",   icon: Home },
  { href: "/colecao",   label: "Coleção",  icon: BookOpen },
  { href: "/repetidas", label: "Repetidas", icon: Repeat2 },
  { href: "/trocas",    label: "Trocas",   icon: RefreshCw },
]

function AppShellInner({ children, user, matchCount }: { children: React.ReactNode; user: User; matchCount: number }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const { resolvedTheme, setTheme } = useTheme()
  const { dupesCount } = useDupesCount()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const initials = user.fullName
    .split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()

  return (
    <div
      className="min-h-screen flex transition-colors duration-300"
      style={{
        background: `
          radial-gradient(1200px 600px at 80% -10%, rgba(255,184,0,0.06), transparent 60%),
          radial-gradient(900px 500px at -10% 30%, rgba(167,139,250,0.05), transparent 60%),
          var(--bg-0)
        `,
      }}
    >
      {/* ── Sidebar (desktop) ───────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-64 min-h-screen fixed left-0 top-0 z-30"
        style={{
          background: "linear-gradient(180deg, var(--bg-sidebar) 0%, var(--bg-0) 100%)",
          borderRight: "1px solid var(--line)",
        }}
      >
        {/* Brand */}
        <div
          className="flex items-center gap-3 px-5 py-5"
          style={{ borderBottom: "1px dashed var(--line)", marginBottom: 16 }}
        >
          <Image
            src="/logo_sem_fundo.png"
            alt="Copa 2026"
            width={44}
            height={44}
            style={{ borderRadius: 10, flexShrink: 0, objectFit: "contain" }}
          />
          <div>
            <p style={{ fontFamily: "var(--font-bebas)", fontSize: 22, letterSpacing: "0.06em", lineHeight: 1, color: "var(--ink-0)" }}>
              COPA 2026
            </p>
            <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--ink-2)", textTransform: "uppercase", marginTop: 3 }}>
              Álbum Digital
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3 flex-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/inicio" && pathname.startsWith(href))
            const badge  = href === "/repetidas" ? dupesCount : href === "/trocas" ? matchCount : 0
            return (
              <Link
                key={href}
                href={href}
                className={cn("ds-nav-item", active && "active")}
              >
                <Icon size={18} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
                {label}
                {badge > 0 && (
                  <span className="ds-nav-badge">{badge}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4">
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ border: "1px solid var(--line)" }}
          >
            <Avatar className="size-9 rounded-xl" style={{ borderRadius: 10 }}>
              <AvatarImage src={user.avatarUrl ?? undefined} />
              <AvatarFallback
                style={{ background: "linear-gradient(135deg, #A78BFA, #F472B6)", color: "white", fontWeight: 700, fontSize: 13 }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-0)" }} className="truncate">{user.fullName}</p>
              <p style={{ fontSize: 11, color: "var(--ink-3)" }} className="truncate">{user.email}</p>
            </div>
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              title={resolvedTheme === "dark" ? "Modo claro" : "Modo escuro"}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--ink-3)" }}
            >
              {resolvedTheme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              onClick={handleLogout}
              title="Sair"
              className="p-1.5 rounded-lg transition-colors hover:text-red-400"
              style={{ color: "var(--ink-3)" }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────── */}
      <main className="flex-1 md:ml-64 pb-24 md:pb-0 min-h-screen">
        {/* Mobile header */}
        <div
          className="md:hidden flex items-center justify-between px-4 py-3.5 sticky top-0 z-20"
          style={{
            background: "rgba(10,14,26,0.9)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo_sem_fundo.png"
              alt="Copa 2026"
              width={30}
              height={30}
              style={{ borderRadius: 8, objectFit: "contain" }}
            />
            <span style={{ fontFamily: "var(--font-bebas)", fontSize: 18, letterSpacing: "0.06em", color: "var(--ink-0)" }}>
              COPA 2026
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-1.5 rounded-lg"
              style={{ color: "var(--ink-3)" }}
            >
              {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Avatar className="size-8" style={{ borderRadius: 8 }}>
              <AvatarImage src={user.avatarUrl ?? undefined} />
              <AvatarFallback style={{ background: "linear-gradient(135deg, #A78BFA, #F472B6)", color: "white", fontWeight: 700, fontSize: 12 }}>
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="p-4 md:p-8 page-enter">{children}</div>
      </main>

      {/* ── Bottom nav (mobile) ─────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30"
        style={{
          background: "rgba(10,14,26,0.95)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid var(--line)",
        }}
      >
        <div className="flex items-center px-3 py-2 pb-safe">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/inicio" && pathname.startsWith(href))
            return (
              <Link key={href} href={href} className="flex-1 flex flex-col items-center gap-1 py-1 transition-all duration-200">
                <div
                  className="flex items-center justify-center w-12 h-8 rounded-xl transition-all duration-200"
                  style={{
                    background: active ? "var(--gold)" : "transparent",
                    boxShadow: active ? "0 4px 16px rgba(255,210,63,0.3)" : "none",
                  }}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.5 : 1.5}
                    style={{ color: active ? "#1a1300" : "var(--ink-3)" }}
                  />
                </div>
                <span
                  className="text-[10px] font-medium tracking-wide transition-colors duration-200"
                  style={{ color: active ? "var(--gold)" : "var(--ink-3)" }}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default function AppShell({ children, user, dupesCount = 0, matchCount = 0 }: Props) {
  return (
    <DupesCountProvider initialCount={dupesCount}>
      <AppShellInner user={user} matchCount={matchCount}>
        {children}
      </AppShellInner>
    </DupesCountProvider>
  )
}
