import { redirect } from "next/navigation"
import DuplicatesManager from "@/components/duplicates-manager"
import { getCurrentUser, getUserDuplicates } from "@/lib/supabase/queries"

export default async function RepétidasPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const duplicates = await getUserDuplicates(user.id)

  const dupMap = new Map<string, number>(
    duplicates.map((d) => [d.sticker_id, d.quantity])
  )

  return <DuplicatesManager userId={user.id} initialDuplicates={dupMap} />
}
