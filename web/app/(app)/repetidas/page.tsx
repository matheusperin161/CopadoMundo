import { createClient } from "@/lib/supabase/server"
import DuplicatesManager from "@/components/duplicates-manager"

export default async function RepétidasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: duplicates } = await supabase
    .from("user_duplicates")
    .select("sticker_id, quantity")
    .eq("user_id", user!.id)

  const dupMap = new Map<string, number>(
    (duplicates ?? []).map((d) => [d.sticker_id, d.quantity])
  )

  return <DuplicatesManager userId={user!.id} initialDuplicates={dupMap} />
}
