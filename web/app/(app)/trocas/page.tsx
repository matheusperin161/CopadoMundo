import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import TradesBoard from "@/components/trades-board"
import { getCurrentUser, getUserCollection, getUserDuplicates } from "@/lib/supabase/queries"

export default async function TrocasPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  // collection and duplicates are cache hits from layout — only trades is a new query
  const supabase = await createClient()
  const [{ data: trades }, collection, duplicates] = await Promise.all([
    supabase
      .from("trades")
      .select("*")
      .or(`status.eq.open,user_id.eq.${user.id}`)
      .order("created_at", { ascending: false }),
    getUserCollection(user.id),
    getUserDuplicates(user.id),
  ])

  const tradeList = trades ?? []
  const userIds   = [...new Set(tradeList.map((t) => t.user_id as string))]

  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds)
    : { data: [] }

  const profilesById     = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))
  const tradesWithProfiles = tradeList.map((t) => ({
    ...t,
    profiles: (profilesById[t.user_id] as { full_name: string | null; avatar_url: string | null } | undefined) ?? null,
  }))

  const ownedIds = collection.map((r) => r.sticker_id)
  const dupesIds = duplicates.filter((d) => d.quantity > 0).map((d) => d.sticker_id)

  return (
    <TradesBoard
      userId={user.id}
      initialTrades={tradesWithProfiles}
      ownedIds={ownedIds}
      dupesIds={dupesIds}
    />
  )
}
