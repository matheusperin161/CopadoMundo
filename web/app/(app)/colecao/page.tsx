import { redirect } from "next/navigation"
import CollectionGrid from "@/components/collection-grid"
import { getCurrentUser, getUserCollection, getUserDuplicates } from "@/lib/supabase/queries"

export default async function ColecaoPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [collection, duplicates] = await Promise.all([
    getUserCollection(user.id),
    getUserDuplicates(user.id),
  ])

  const ownedSet = new Set<string>(collection.map((r) => r.sticker_id))
  const dupMap   = new Map<string, number>(duplicates.map((d) => [d.sticker_id, d.quantity]))

  return (
    <CollectionGrid
      userId={user.id}
      initialOwned={ownedSet}
      initialDuplicates={dupMap}
    />
  )
}
