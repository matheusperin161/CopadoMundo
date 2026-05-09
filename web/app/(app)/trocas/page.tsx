import { createClient } from "@/lib/supabase/server"
import TradesBoard from "@/components/trades-board"

export const dynamic = "force-dynamic"

export default async function TrocasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trades } = await supabase
    .from("trades")
    .select("*")
    .or(`status.eq.open,user_id.eq.${user!.id}`)
    .order("created_at", { ascending: false })

  const tradeList = trades ?? []
  const userIds = [...new Set(tradeList.map((t) => t.user_id as string))]

  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds)
    : { data: [] }

  const profilesById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))
  const tradesWithProfiles = tradeList.map((t) => ({
    ...t,
    profiles: (profilesById[t.user_id] as { full_name: string | null; avatar_url: string | null } | undefined) ?? null,
  }))

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

      <TradesBoard userId={user!.id} initialTrades={tradesWithProfiles} />
    </div>
  )
}
