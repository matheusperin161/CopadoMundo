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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-black text-white" style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.05em" }}>
          Figurinhas Repetidas
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Use + e − para controlar quantas repetidas você tem de cada figurinha
        </p>
      </div>

      <DuplicatesManager userId={user!.id} initialDuplicates={dupMap} />
    </div>
  )
}
