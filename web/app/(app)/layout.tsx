import { redirect } from "next/navigation"
import AppShell from "@/components/app-shell"
import { getCurrentUser, getUserProfile, getUserCollection, getUserDuplicates, getOpenTrades } from "@/lib/supabase/queries"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) redirect("/login")

  const [profile, duplicates, trades, collection] = await Promise.all([
    getUserProfile(user.id),
    getUserDuplicates(user.id),
    getOpenTrades(user.id),
    getUserCollection(user.id),
  ])

  const dupesCount = duplicates.reduce((sum, d) => sum + (d.quantity ?? 0), 0)
  const ownedSet   = new Set(collection.map((r) => r.sticker_id))
  const dupesSet   = new Set(duplicates.filter((d) => d.quantity > 0).map((d) => d.sticker_id))
  const matchCount = trades.filter((t) =>
    dupesSet.has(t.wanting_sticker_id) && !ownedSet.has(t.offering_sticker_id)
  ).length

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
