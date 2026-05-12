"use client"

import { useState, useEffect } from "react"
import { ALL_STICKERS, countryGradient } from "@/lib/data/stickers"
import { ArrowLeftRight } from "lucide-react"
import TradeChat from "@/components/trade-chat"
import { useChatContext } from "@/components/chat-provider"

export interface Conversation {
  tradeId: string
  proposerId: string
  lastMessage: string
  lastMessageAt: string
  lastSenderId: string
  offeringStickerI: string
  wantingStickerI: string
  otherUserName: string
}

interface Props {
  userId: string
  conversations: Conversation[]
}

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #A78BFA, #F472B6)",
  "linear-gradient(135deg, #38BDF8, #34D399)",
  "linear-gradient(135deg, #FFD23F, #FF6B6B)",
  "linear-gradient(135deg, #F472B6, #38BDF8)",
  "linear-gradient(135deg, #34D399, #A78BFA)",
]
function avatarGradient(s: string) {
  const n = s.charCodeAt(0) + s.charCodeAt(s.length - 1)
  return AVATAR_GRADIENTS[n % AVATAR_GRADIENTS.length]
}

function isUnread(conv: Conversation, userId: string): boolean {
  if (conv.lastSenderId === userId) return false
  try {
    const v = localStorage.getItem(`chat-read:${conv.tradeId}:${conv.proposerId}`)
    if (!v) return true
    return new Date(conv.lastMessageAt) > new Date(v)
  } catch { return false }
}

export default function ChatList({ userId, conversations }: Props) {
  const [openConv, setOpenConv] = useState<Conversation | null>(null)
  const { markConversationRead } = useChatContext()
  // Hydrated client-side so localStorage is available
  const [unreadSet, setUnreadSet] = useState<Set<string>>(new Set())

  useEffect(() => {
    const keys = conversations
      .filter((c) => isUnread(c, userId))
      .map((c) => `${c.tradeId}:${c.proposerId}`)
    setUnreadSet(new Set(keys))
  }, [conversations, userId])

  function openChat(conv: Conversation) {
    setOpenConv(conv)
    markConversationRead(conv.tradeId, conv.proposerId)
    setUnreadSet((prev) => {
      const next = new Set(prev)
      next.delete(`${conv.tradeId}:${conv.proposerId}`)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 6 }}>
          Mensagens
        </div>
        <h1 style={{ fontFamily: "var(--font-bebas)", fontSize: 56, letterSpacing: "0.02em", lineHeight: 0.95, margin: 0, color: "var(--ink-0)" }}>
          Meu <span style={{ color: "var(--gold)" }}>Chat</span>
        </h1>
        <p style={{ color: "var(--ink-2)", marginTop: 8, fontSize: 14 }}>
          Todas as suas conversas sobre trocas em um só lugar.
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="ds-empty">
          <div className="ds-empty-icon">💬</div>
          <div>Nenhuma conversa ainda.<br />Proponha uma troca para iniciar!</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {conversations.map((conv) => {
            const key      = `${conv.tradeId}:${conv.proposerId}`
            const unread   = unreadSet.has(key)
            const offering = ALL_STICKERS.find((s) => s.id === conv.offeringStickerI)
            const wanting  = ALL_STICKERS.find((s) => s.id === conv.wantingStickerI)
            const isMe     = conv.lastSenderId === userId
            const initials = conv.otherUserName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()

            return (
              <button
                key={key}
                onClick={() => openChat(conv)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px", borderRadius: 14, width: "100%",
                  background: unread ? "var(--bg-1)" : "var(--bg-card)",
                  border: `1px solid ${unread ? "rgba(255,210,63,0.35)" : "var(--line)"}`,
                  borderLeft: unread ? "3px solid var(--gold)" : undefined,
                  cursor: "pointer", fontFamily: "inherit", color: "var(--ink-0)",
                  textAlign: "left", transition: "border-color .15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = unread ? "rgba(255,210,63,0.6)" : "var(--line-2)" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = unread ? "rgba(255,210,63,0.35)" : "var(--line)" }}
              >
                {/* Avatar with unread dot */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: avatarGradient(conv.otherUserName),
                    display: "grid", placeItems: "center",
                    fontFamily: "var(--font-bebas)", fontSize: 17, color: "white",
                  }}>
                    {initials}
                  </div>
                  {unread && (
                    <span style={{
                      position: "absolute", bottom: 1, right: 1,
                      width: 11, height: 11, borderRadius: "50%",
                      background: "var(--gold)", border: "2px solid var(--bg-0)",
                    }} />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: unread ? 700 : 600, fontSize: 14, marginBottom: 3, color: unread ? "var(--ink-0)" : "var(--ink-1)" }}>
                    {conv.otherUserName}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div
                      className="trade-mini"
                      style={{ "--country-bg": offering ? countryGradient(offering.countryCode) : undefined, width: 20, height: 28, fontSize: 9, flexShrink: 0 } as React.CSSProperties}
                    >
                      {offering?.number}
                    </div>
                    <ArrowLeftRight size={9} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
                    <div
                      className="trade-mini"
                      style={{ "--country-bg": wanting ? countryGradient(wanting.countryCode) : undefined, width: 20, height: 28, fontSize: 9, flexShrink: 0 } as React.CSSProperties}
                    >
                      {wanting?.number}
                    </div>
                    <span style={{ fontSize: 12, color: unread ? "var(--ink-1)" : "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: unread ? 500 : 400 }}>
                      {isMe && <span style={{ color: "var(--ink-3)", marginRight: 2 }}>Você:</span>}
                      {conv.lastMessage}
                    </span>
                  </div>
                </div>

                {/* Date + unread badge */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: unread ? "var(--gold)" : "var(--ink-3)" }}>
                    {new Date(conv.lastMessageAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                  </span>
                  {unread && (
                    <span style={{
                      minWidth: 18, height: 18, borderRadius: 999,
                      background: "var(--gold)", color: "#1a1300",
                      fontSize: 10, fontWeight: 700,
                      display: "grid", placeItems: "center", padding: "0 4px",
                    }}>
                      N
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Chat sheet */}
      {openConv && (
        <TradeChat
          open={!!openConv}
          onClose={() => setOpenConv(null)}
          tradeId={openConv.tradeId}
          offeringStickerI={openConv.offeringStickerI}
          wantingStickerI={openConv.wantingStickerI}
          currentUserId={userId}
          otherUserName={openConv.otherUserName}
          proposerId={openConv.proposerId}
        />
      )}
    </div>
  )
}
