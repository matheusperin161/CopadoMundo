import { createClient } from "@/lib/supabase/server"
import CollectionGrid from "@/components/collection-grid"

export default async function ColecaoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: collection } = await supabase
    .from("user_collection")
    .select("sticker_id")
    .eq("user_id", user!.id)

  const ownedSet = new Set<string>((collection ?? []).map((r) => r.sticker_id))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-black text-white" style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.05em" }}>
          Minha Coleção
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Clique em uma figurinha para marcar como coletada
        </p>
      </div>

      <CollectionGrid userId={user!.id} initialOwned={ownedSet} />
    </div>
  )
}
