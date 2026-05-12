import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/supabase/queries"
import { createClient } from "@/lib/supabase/server"
import ChatList, { type Conversation } from "@/components/chat-list"

export default async function ChatPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const supabase = await createClient()

  // Trades owned by the user (to identify owner-side conversations)
  const { data: myTrades } = await supabase
    .from("trades")
    .select("id, offering_sticker_id, wanting_sticker_id, user_id")
    .eq("user_id", user.id)

  const myTradeIds = (myTrades ?? []).map((t) => t.id)

  // Messages where I'm the proposer
  const { data: asProp } = await supabase
    .from("trade_messages")
    .select("trade_id, sender_id, proposer_id, content, created_at")
    .eq("proposer_id", user.id)
    .order("created_at", { ascending: false })

  // Messages where I'm the trade owner (exclude my own proposer conversations)
  const { data: asOwner } = myTradeIds.length > 0
    ? await supabase
        .from("trade_messages")
        .select("trade_id, sender_id, proposer_id, content, created_at")
        .in("trade_id", myTradeIds)
        .neq("proposer_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [] }

  // Keep only the last message per (trade_id, proposer_id) conversation
  const convMap = new Map<string, typeof asProp extends (infer T)[] | null ? T : never>()
  for (const msg of [...(asProp ?? []), ...(asOwner ?? [])]) {
    const key = `${msg.trade_id}:${msg.proposer_id}`
    const cur = convMap.get(key)
    if (!cur || msg.created_at > cur.created_at) convMap.set(key, msg)
  }

  const lastMsgs = [...convMap.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  // Fetch trade details for all conversations
  const tradeIds = [...new Set(lastMsgs.map((m) => m.trade_id))]
  const { data: tradesData } = tradeIds.length > 0
    ? await supabase
        .from("trades")
        .select("id, offering_sticker_id, wanting_sticker_id, user_id")
        .in("id", tradeIds)
    : { data: [] }

  // Fetch profiles for all other users
  const otherUserIds = [...new Set(
    lastMsgs.map((m) => {
      const trade = (tradesData ?? []).find((t) => t.id === m.trade_id)
      return trade?.user_id === user.id ? m.proposer_id : trade?.user_id
    }).filter(Boolean) as string[]
  )]
  const { data: profilesData } = otherUserIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", otherUserIds)
    : { data: [] }

  const tradesById   = Object.fromEntries((tradesData   ?? []).map((t) => [t.id, t]))
  const profilesById = Object.fromEntries((profilesData ?? []).map((p) => [p.id, p]))

  const conversations: Conversation[] = lastMsgs.map((m) => {
    const trade       = tradesById[m.trade_id]
    const isOwner     = trade?.user_id === user.id
    const otherUserId = isOwner ? m.proposer_id : trade?.user_id
    return {
      tradeId:         m.trade_id,
      proposerId:      m.proposer_id,
      lastMessage:     m.content,
      lastMessageAt:   m.created_at,
      lastSenderId:    m.sender_id,
      offeringStickerI: trade?.offering_sticker_id ?? "",
      wantingStickerI:  trade?.wanting_sticker_id  ?? "",
      otherUserName:   (otherUserId ? profilesById[otherUserId]?.full_name : null) ?? "Usuário",
    }
  })

  return <ChatList userId={user.id} conversations={conversations} />
}
