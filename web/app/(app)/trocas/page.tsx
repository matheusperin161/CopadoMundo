import { createClient } from "@/lib/supabase/server"
import TradesBoard from "@/components/trades-board"

export default async function TrocasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trades } = await supabase
    .from("trades")
    .select("*, profiles(full_name, avatar_url)")
    .eq("status", "open")
    .order("created_at", { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-black text-white" style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.05em" }}>
          Mural de Trocas
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Publique suas repetidas e encontre as figurinhas que faltam
        </p>
      </div>

      <TradesBoard userId={user!.id} initialTrades={trades ?? []} />
    </div>
  )
}
