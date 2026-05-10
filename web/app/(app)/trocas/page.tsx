import { createClient } from "@/lib/supabase/server"
import TradesBoard from "@/components/trades-board"

export default async function TrocasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: trades }, { data: collection }, { data: duplicates }] = await Promise.all([
    supabase.from("trades").select("*")
      .or(`status.eq.open,user_id.eq.${user!.id}`)
      .order("created_at", { ascending: false }),
    supabase.from("user_collection").select("sticker_id").eq("user_id", user!.id),
    supabase.from("user_duplicates").select("sticker_id, quantity").eq("user_id", user!.id),
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

  const ownedIds = (collection ?? []).map((r) => r.sticker_id)
  const dupesIds = (duplicates ?? []).filter((d) => d.quantity > 0).map((d) => d.sticker_id)

  return (
    <TradesBoard
      userId={user!.id}
      initialTrades={tradesWithProfiles}
      ownedIds={ownedIds}
      dupesIds={dupesIds}
    />
  )
}
