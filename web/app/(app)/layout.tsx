import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AppShell from "@/components/app-shell"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const [{ data: profile }, { data: duplicates }, { data: trades }, { data: collection }] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single(),
    supabase.from("user_duplicates").select("quantity").eq("user_id", user.id),
    supabase.from("trades").select("wanting_sticker_id").eq("status", "open").neq("user_id", user.id),
    supabase.from("user_collection").select("sticker_id").eq("user_id", user.id),
  ])

  const dupesCount = (duplicates ?? []).reduce((sum, d) => sum + (d.quantity ?? 0), 0)
  const ownedSet   = new Set((collection ?? []).map((r) => r.sticker_id))
  const matchCount = (trades ?? []).filter((t) => ownedSet.has(t.wanting_sticker_id)).length

  return (
    <AppShell
      user={{
        id: user.id,
        email: user.email ?? "",
        fullName: profile?.full_name ?? user.email ?? "Usuário",
        avatarUrl: profile?.avatar_url ?? null,
      }}
      dupesCount={dupesCount}
      matchCount={matchCount}
    >
      {children}
    </AppShell>
  )
}
