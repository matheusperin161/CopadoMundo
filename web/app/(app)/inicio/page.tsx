import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ALL_STICKERS } from "@/lib/data/stickers"
import InicioContent from "@/components/inicio-content"

export default async function InicioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const [
    { data: profile },
    { data: collection },
    { data: duplicates },
    { data: trades },
  ] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase.from("user_collection").select("sticker_id").eq("user_id", user.id),
    supabase.from("user_duplicates").select("sticker_id, quantity").eq("user_id", user.id),
    supabase.from("trades").select("*, profiles(full_name, avatar_url)")
      .eq("status", "open").neq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(20),
  ])

  const ownedIds   = (collection ?? []).map((r) => r.sticker_id)
  const ownedSet   = new Set(ownedIds)
  const totalDupes = (duplicates ?? []).reduce((sum, d) => sum + d.quantity, 0)
  const dupesSet   = new Set((duplicates ?? []).filter((d) => d.quantity > 0).map((d) => d.sticker_id))

  const firstName = (profile?.full_name ?? user.email ?? "Usuário").split(" ")[0]

  // Recent stickers (last 6 collected — using last in the array as approximation)
  const recentOwned = ALL_STICKERS.filter((s) => ownedSet.has(s.id)).slice(-6).reverse()

  // Matching trades: they want something I have as dupe AND offer something I don't own
  const matchingTrades = (trades ?? [])
    .filter((t: { wanting_sticker_id: string; offering_sticker_id: string }) =>
      dupesSet.has(t.wanting_sticker_id) && !ownedSet.has(t.offering_sticker_id)
    )
    .slice(0, 4)
    .map((t: { id: string; user_id: string; offering_sticker_id: string; wanting_sticker_id: string; profiles: { full_name: string | null } | null }) => t)

  return (
    <InicioContent
      firstName={firstName}
      totalOwned={ownedSet.size}
      totalStickers={ALL_STICKERS.length}
      totalDupes={totalDupes}
      matchCount={matchingTrades.length}
      recentOwned={recentOwned}
      matchingTrades={matchingTrades}
    />
  )
}
