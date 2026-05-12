"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

interface ChatContextValue {
  unreadCount: number
  markConversationRead: (tradeId: string, proposerId: string) => void
}

const ChatContext = createContext<ChatContextValue>({
  unreadCount: 0,
  markConversationRead: () => {},
})

export function useChatContext() {
  return useContext(ChatContext)
}

function getLastRead(tradeId: string, proposerId: string): Date | null {
  try {
    const v = localStorage.getItem(`chat-read:${tradeId}:${proposerId}`)
    return v ? new Date(v) : null
  } catch { return null }
}

export default function ChatProvider({
  children,
  userId,
}: {
  children: React.ReactNode
  userId: string
}) {
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  const markConversationRead = useCallback((tradeId: string, proposerId: string) => {
    try {
      localStorage.setItem(`chat-read:${tradeId}:${proposerId}`, new Date().toISOString())
    } catch {}
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  useEffect(() => {
    // Request browser notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }

    // Subscribe to new messages — RLS ensures we only receive messages we're involved in
    const channel = supabase
      .channel(`chat-notify:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trade_messages" },
        async (payload) => {
          const msg = payload.new as {
            trade_id: string
            sender_id: string
            proposer_id: string
            content: string
            created_at: string
          }

          // Ignore own messages
          if (msg.sender_id === userId) return

          // Ignore if already read (conversation was open)
          const lastRead = getLastRead(msg.trade_id, msg.proposer_id)
          if (lastRead && new Date(msg.created_at) <= lastRead) return

          setUnreadCount((prev) => prev + 1)

          // Browser notification
          if ("Notification" in window && Notification.permission === "granted") {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", msg.sender_id)
              .single()

            const name = profile?.full_name?.split(" ")[0] ?? "Alguém"
            const body = msg.content.length > 80 ? msg.content.slice(0, 80) + "…" : msg.content

            new Notification(`💬 ${name} enviou uma mensagem`, {
              body,
              icon: "/logo_sem_fundo.png",
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  return (
    <ChatContext.Provider value={{ unreadCount, markConversationRead }}>
      {children}
    </ChatContext.Provider>
  )
}
