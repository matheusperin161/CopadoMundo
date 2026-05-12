"use client"

import { useState, useEffect, useRef } from "react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
import { ALL_STICKERS, countryGradient } from "@/lib/data/stickers"
import { ArrowLeftRight, Send } from "lucide-react"

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
}

interface Props {
  open: boolean
  onClose: () => void
  tradeId: string
  offeringStickerI: string
  wantingStickerI: string
  currentUserId: string
  otherUserName: string
  // identifies the conversation thread — always the non-owner's id
  proposerId: string
}

export default function TradeChat({
  open, onClose,
  tradeId, offeringStickerI, wantingStickerI,
  currentUserId, otherUserName, proposerId,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState("")
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)
  const supabase                = createClient()

  const offeringSticker = ALL_STICKERS.find((s) => s.id === offeringStickerI)
  const wantingSticker  = ALL_STICKERS.find((s) => s.id === wantingStickerI)

  useEffect(() => {
    if (!open || !proposerId) return
    setLoading(true)
    setMessages([])

    supabase
      .from("trade_messages")
      .select("id, sender_id, content, created_at")
      .eq("trade_id", tradeId)
      .eq("proposer_id", proposerId)
      .order("created_at", { ascending: true })
      .then(({ data }) => { setMessages(data ?? []); setLoading(false) })

    const channel = supabase
      .channel(`chat:${tradeId}:${proposerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trade_messages", filter: `trade_id=eq.${tradeId}` },
        (payload) => {
          const msg = payload.new as Message & { proposer_id: string }
          if (msg.proposer_id === proposerId) setMessages((prev) => [...prev, msg])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [open, tradeId, proposerId])

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || !proposerId) return
    setSending(true)
    await supabase.from("trade_messages").insert({
      trade_id:    tradeId,
      sender_id:   currentUserId,
      proposer_id: proposerId,
      content:     text,
    })
    setInput("")
    setSending(false)
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        showCloseButton
        style={{
          maxWidth: 400, width: "100%", padding: 0,
          display: "flex", flexDirection: "column",
          background: "var(--bg-card)", borderLeft: "1px solid var(--line-2)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid var(--line)", paddingRight: 52 }}>
          <SheetTitle style={{ fontFamily: "var(--font-bebas)", fontSize: 24, letterSpacing: "0.04em", color: "var(--ink-0)", margin: 0 }}>
            Chat da Troca
          </SheetTitle>
          <div style={{ color: "var(--ink-3)", fontSize: 12, marginTop: 2 }}>com {otherUserName}</div>

          {/* Sticker summary */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <div
              className="trade-mini"
              style={{ "--country-bg": offeringSticker ? countryGradient(offeringSticker.countryCode) : undefined, width: 30, height: 42, fontSize: 11 } as React.CSSProperties}
            >
              {offeringSticker?.number}
            </div>
            <ArrowLeftRight size={11} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
            <div
              className="trade-mini"
              style={{ "--country-bg": wantingSticker ? countryGradient(wantingSticker.countryCode) : undefined, width: 30, height: 42, fontSize: 11 } as React.CSSProperties}
            >
              {wantingSticker?.number}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-2)", lineHeight: 1.4 }}>
              <div style={{ fontWeight: 600 }}>{offeringSticker?.code}</div>
              <div style={{ color: "var(--ink-3)" }}>{wantingSticker?.code}</div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {loading ? (
            <div style={{ color: "var(--ink-3)", fontSize: 13, textAlign: "center", paddingTop: 40 }}>
              Carregando…
            </div>
          ) : messages.length === 0 ? (
            <div style={{ color: "var(--ink-3)", fontSize: 13, textAlign: "center", paddingTop: 40, lineHeight: 1.7 }}>
              Nenhuma mensagem ainda.<br />Inicie a conversa!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId
              return (
                <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "78%", padding: "8px 12px",
                    borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: isMe ? "var(--gold)" : "var(--bg-1)",
                    color: isMe ? "#1a1300" : "var(--ink-0)",
                    fontSize: 13, lineHeight: 1.5, wordBreak: "break-word",
                  }}>
                    {msg.content}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 2, paddingInline: 4 }}>
                    {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "10px 14px 16px", borderTop: "1px solid var(--line)", display: "flex", gap: 8 }}>
          <input
            placeholder="Mensagem…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            style={{
              flex: 1, background: "var(--bg-1)", border: "1px solid var(--line)",
              borderRadius: 10, padding: "10px 12px", color: "var(--ink-0)",
              fontSize: 13, fontFamily: "inherit", outline: "none", transition: "border-color .15s",
            }}
            onFocus={(e) => { e.target.style.borderColor = "var(--line-2)" }}
            onBlur={(e)  => { e.target.style.borderColor = "var(--line)"   }}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="ds-btn primary"
            style={{ padding: "0 14px", borderRadius: 10, flexShrink: 0 }}
          >
            <Send size={14} />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
