import { createClient } from "@/lib/supabase/server"
import CollectionGrid from "@/components/collection-grid"

export default async function ColecaoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: collection }, { data: duplicates }] = await Promise.all([
    supabase.from("user_collection").select("sticker_id").eq("user_id", user!.id),
    supabase.from("user_duplicates").select("sticker_id, quantity").eq("user_id", user!.id),
  ])

  const ownedSet = new Set<string>((collection ?? []).map((r) => r.sticker_id))
  const dupMap   = new Map<string, number>((duplicates ?? []).map((d) => [d.sticker_id, d.quantity]))

  return (
    <CollectionGrid
      userId={user!.id}
      initialOwned={ownedSet}
      initialDuplicates={dupMap}
    />
  )
}
