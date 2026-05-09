"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ALL_STICKERS, ALL_COUNTRIES, countryGradient } from "@/lib/data/stickers"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Plus, Search, ArrowLeftRight, Pencil, CheckCircle, RotateCcw, Trash2 } from "lucide-react"

interface Trade {
  id: string
  user_id: string
  offering_sticker_id: string
  wanting_sticker_id: string
  note: string | null
  status: string
  created_at: string
  profiles: { full_name: string | null; avatar_url: string | null } | null
}

interface Props {
  userId: string
  initialTrades: Trade[]
  ownedIds?: string[]
}

type TradeFilter = "all" | "matches" | "open" | "mine"

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #A78BFA, #F472B6)",
  "linear-gradient(135deg, #38BDF8, #34D399)",
  "linear-gradient(135deg, #FFD23F, #FF6B6B)",
  "linear-gradient(135deg, #F472B6, #38BDF8)",
  "linear-gradient(135deg, #34D399, #A78BFA)",
]
function avatarGradient(userId: string) {
  const n = userId.charCodeAt(0) + userId.charCodeAt(userId.length - 1)
  return AVATAR_GRADIENTS[n % AVATAR_GRADIENTS.length]
}

function StickerSearchField({
  label, placeholder, searchValue, selectedId, onSearchChange, onSelect,
}: {
  label: string; placeholder: string; searchValue: string; selectedId: string
  onSearchChange: (v: string) => void; onSelect: (id: string, code: string) => void
}) {
  const suggestions = ALL_STICKERS.filter((s) =>
    searchValue.length >= 2 &&
    (s.code.toLowerCase().includes(searchValue.toLowerCase()) ||
      s.country.toLowerCase().includes(searchValue.toLowerCase()))
  ).slice(0, 6)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-2)" }}>
        {label}
      </label>
      <div className="search-box" style={{ borderRadius: 10 }}>
        <Search size={14} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
        <input
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {selectedId && (
          <span style={{ color: "var(--gold)", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>✓</span>
        )}
      </div>
      {suggestions.length > 0 && !selectedId && (
        <div style={{ display: "flex", flexDirection: "column", borderRadius: 10, border: "1px solid var(--line)", overflow: "hidden" }}>
          {suggestions.map((s) => {
            const c = ALL_COUNTRIES.find((x) => x.code === s.countryCode)
            return (
              <button
                key={s.id}
                onClick={() => onSelect(s.id, s.code)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", textAlign: "left", background: "var(--bg-card)", borderBottom: "1px solid var(--line)", fontSize: 13, cursor: "pointer", border: "none", fontFamily: "inherit", color: "var(--ink-0)", transition: "background .12s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-1)" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-card)" }}
              >
                {c?.flag && <span style={{ fontSize: 16 }}>{c.flag}</span>}
                <span style={{ fontWeight: 700 }}>{s.code}</span>
                <span style={{ color: "var(--ink-3)", fontSize: 12 }}>{s.country}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function TradesBoard({ userId, initialTrades, ownedIds = [] }: Props) {
  const [trades, setTrades]       = useState<Trade[]>(initialTrades)
  const [filter, setFilter]       = useState<TradeFilter>("all")
  const [searchFilter, setSearch] = useState("")
  const [openDialog, setOpenDialog]     = useState(false)
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null)
  const [pending, startTransition]      = useTransition()
  const router = useRouter()

  const [offeringId, setOfferingId]         = useState("")
  const [wantingId, setWantingId]           = useState("")
  const [note, setNote]                     = useState("")
  const [offeringSearch, setOfferingSearch] = useState("")
  const [wantingSearch, setWantingSearch]   = useState("")

  const supabase = createClient()
  const ownedSet = useMemo(() => new Set(ownedIds), [ownedIds])

  const matchCount = useMemo(
    () => trades.filter((t) => t.user_id !== userId && t.status === "open" && ownedSet.has(t.wanting_sticker_id)).length,
    [trades, userId, ownedSet]
  )

  const filteredTrades = useMemo(() => {
    let list = trades
    if (filter === "matches") list = list.filter((t) => t.user_id !== userId && t.status === "open" && ownedSet.has(t.wanting_sticker_id))
    if (filter === "mine")    list = list.filter((t) => t.user_id === userId)
    if (filter === "open")    list = list.filter((t) => t.user_id !== userId && t.status === "open")
    if (searchFilter) {
      const q = searchFilter.toLowerCase()
      const offering = (id: string) => ALL_STICKERS.find((x) => x.id === id)
      list = list.filter((t) => {
        const o = offering(t.offering_sticker_id)
        const w = offering(t.wanting_sticker_id)
        return (
          o?.code.toLowerCase().includes(q) || o?.country.toLowerCase().includes(q) ||
          w?.code.toLowerCase().includes(q) || w?.country.toLowerCase().includes(q) ||
          (t.profiles?.full_name?.toLowerCase().includes(q) ?? false)
        )
      })
    }
    return list
  }, [trades, filter, searchFilter, userId, ownedSet])

  function openCreateDialog() {
    setEditingTrade(null); setOfferingId(""); setWantingId(""); setNote("")
    setOfferingSearch(""); setWantingSearch(""); setOpenDialog(true)
  }
  function openEditDialog(trade: Trade) {
    const o = ALL_STICKERS.find((s) => s.id === trade.offering_sticker_id)
    const w = ALL_STICKERS.find((s) => s.id === trade.wanting_sticker_id)
    setEditingTrade(trade); setOfferingId(trade.offering_sticker_id); setWantingId(trade.wanting_sticker_id)
    setNote(trade.note ?? ""); setOfferingSearch(o?.code ?? ""); setWantingSearch(w?.code ?? "")
    setOpenDialog(true)
  }

  async function handleCreateTrade() {
    if (!offeringId || !wantingId) { toast.error("Selecione as duas figurinhas"); return }
    startTransition(async () => {
      const { data: inserted, error } = await supabase.from("trades")
        .insert({ user_id: userId, offering_sticker_id: offeringId, wanting_sticker_id: wantingId, note: note || null, status: "open" })
        .select().single()
      if (error) { toast.error("Erro ao criar troca"); return }
      const { data: profile } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", userId).single()
      setTrades([{ ...inserted, profiles: profile ?? null }, ...trades])
      setOpenDialog(false); router.refresh(); toast.success("Troca publicada!")
    })
  }

  async function handleEditTrade() {
    if (!editingTrade || !offeringId || !wantingId) { toast.error("Selecione as duas figurinhas"); return }
    startTransition(async () => {
      const { error } = await supabase.from("trades")
        .update({ offering_sticker_id: offeringId, wanting_sticker_id: wantingId, note: note || null })
        .eq("id", editingTrade.id).eq("user_id", userId)
      if (error) { toast.error("Erro ao editar troca"); return }
      setTrades(trades.map((t) => t.id === editingTrade.id ? { ...t, offering_sticker_id: offeringId, wanting_sticker_id: wantingId, note: note || null } : t))
      setOpenDialog(false); router.refresh(); toast.success("Troca atualizada!")
    })
  }

  async function handleDeleteTrade(tradeId: string) {
    startTransition(async () => {
      const { error } = await supabase.from("trades").delete().eq("id", tradeId).eq("user_id", userId)
      if (error) { toast.error("Erro ao remover troca"); return }
      setTrades(trades.filter((t) => t.id !== tradeId)); router.refresh(); toast.success("Troca removida")
    })
  }

  async function handleToggleStatus(trade: Trade) {
    const newStatus = trade.status === "open" ? "closed" : "open"
    startTransition(async () => {
      const { error } = await supabase.from("trades").update({ status: newStatus }).eq("id", trade.id).eq("user_id", userId)
      if (error) { toast.error("Erro ao atualizar status"); return }
      setTrades(trades.map((t) => t.id === trade.id ? { ...t, status: newStatus } : t)); router.refresh()
      toast.success(newStatus === "closed" ? "Troca marcada como realizada!" : "Troca reaberta!")
    })
  }

  const dialogOfferingSticker = offeringId ? ALL_STICKERS.find((s) => s.id === offeringId) : undefined
  const dialogWantingSticker  = wantingId  ? ALL_STICKERS.find((s) => s.id === wantingId)  : undefined

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 6 }}>
          Mural de trocas
        </div>
        <h1 style={{ fontFamily: "var(--font-bebas)", fontSize: 56, letterSpacing: "0.02em", lineHeight: 0.95, margin: 0, color: "var(--ink-0)" }}>
          Mural de <span style={{ color: "var(--gold)" }}>Trocas</span>
        </h1>
        <p style={{ color: "var(--ink-2)", marginTop: 8, fontSize: 14 }}>
          Trocas que combinam com suas faltantes aparecem com um selo MATCH verde no canto.
        </p>
      </div>

      {/* Search + Publicar */}
      <div className="search-row">
        <div className="search-box">
          <Search size={15} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
          <input
            placeholder="Buscar usuário, seleção ou código…"
            value={searchFilter}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="ds-btn primary" onClick={openCreateDialog}>
          <Plus size={14} /> Publicar Troca
        </button>
      </div>

      {/* Pills */}
      <div className="pills">
        <button className={cn("pill", filter === "all" && "active")} onClick={() => setFilter("all")}>
          Todas <span className="count">{trades.length}</span>
        </button>
        <button className={cn("pill", filter === "matches" && "active")} onClick={() => setFilter("matches")}>
          ✨ Combinam comigo <span className="count">{matchCount}</span>
        </button>
        <button className={cn("pill", filter === "open" && "active")} onClick={() => setFilter("open")}>
          Abertas
        </button>
        <button className={cn("pill", filter === "mine" && "active")} onClick={() => setFilter("mine")}>
          Minhas
        </button>
      </div>

      {/* Trades grid */}
      {filteredTrades.length === 0 ? (
        <div className="ds-empty">
          <div className="ds-empty-icon">🔄</div>
          <div>Nenhuma troca encontrada</div>
        </div>
      ) : (
        <div className="trade-grid">
          {filteredTrades.map((trade) => {
            const isOwn    = trade.user_id === userId
            const isClosed = trade.status === "closed"
            const isMatch  = !isOwn && trade.status === "open" && ownedSet.has(trade.wanting_sticker_id)

            const initials = (trade.profiles?.full_name ?? "U")
              .split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()

            const offeringSticker = ALL_STICKERS.find((s) => s.id === trade.offering_sticker_id)
            const wantingSticker  = ALL_STICKERS.find((s) => s.id === trade.wanting_sticker_id)
            const offeringCountry = ALL_COUNTRIES.find((c) => c.code === offeringSticker?.countryCode)
            const wantingCountry  = ALL_COUNTRIES.find((c) => c.code === wantingSticker?.countryCode)

            return (
              <div
                key={trade.id}
                className={cn("trade-card", isMatch && "match", isClosed && "opacity-50")}
              >
                {/* Header */}
                <div className="trade-head">
                  <div
                    className="trade-av"
                    style={{ background: avatarGradient(trade.user_id) }}
                  >
                    {initials}
                  </div>
                  <div>
                    <div className="trade-name">{trade.profiles?.full_name ?? "Usuário"}</div>
                    <div className="trade-meta">
                      {new Date(trade.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <div className="trade-badges">
                    {isOwn && <span className="trade-status mine">Minha</span>}
                    <span className={cn("trade-status", isClosed ? "closed" : "open")}>
                      {isClosed ? "Realizada" : "Aberta"}
                    </span>
                  </div>
                </div>

                {/* Sticker row */}
                <div className="trade-row">
                  <div className="trade-side">
                    <div
                      className="trade-mini"
                      style={{ "--country-bg": offeringSticker ? countryGradient(offeringSticker.countryCode) : undefined } as React.CSSProperties}
                    >
                      {offeringSticker?.number}
                    </div>
                    <div>
                      <div className="trade-lbl">Oferece</div>
                      <div className="trade-ttl">{offeringSticker?.code ?? trade.offering_sticker_id}</div>
                      <div className="trade-sub">{offeringCountry?.flag} {offeringSticker?.country}</div>
                    </div>
                  </div>

                  <div className="swap-icon">
                    <ArrowLeftRight size={14} />
                  </div>

                  <div className="trade-side right">
                    <div
                      className="trade-mini"
                      style={{ "--country-bg": wantingSticker ? countryGradient(wantingSticker.countryCode) : undefined } as React.CSSProperties}
                    >
                      {wantingSticker?.number}
                    </div>
                    <div>
                      <div className="trade-lbl">Quer</div>
                      <div className="trade-ttl">{wantingSticker?.code ?? trade.wanting_sticker_id}</div>
                      <div className="trade-sub">{wantingCountry?.flag} {wantingSticker?.country}</div>
                    </div>
                  </div>
                </div>

                {/* Match meter */}
                {isMatch && (
                  <div className="match-meter">
                    <span>Você tem o que ele quer</span>
                    <div className="match-bar">
                      <div className="match-bar-fill" style={{ width: "100%" }} />
                    </div>
                    <span style={{ color: "var(--success)", fontWeight: 700 }}>100%</span>
                  </div>
                )}

                {/* Note */}
                {trade.note && (
                  <div className="trade-msg">&ldquo;{trade.note}&rdquo;</div>
                )}

                {/* Actions */}
                <div className="trade-actions">
                  {isOwn ? (
                    <>
                      {!isClosed && (
                        <button className="ds-btn" onClick={() => openEditDialog(trade)} disabled={pending}>
                          <Pencil size={13} /> Editar
                        </button>
                      )}
                      <button
                        className={cn("ds-btn", isClosed ? "" : "success")}
                        onClick={() => handleToggleStatus(trade)}
                        disabled={pending}
                      >
                        {isClosed ? <><RotateCcw size={13} /> Reabrir</> : <><CheckCircle size={13} /> Marcar como realizada</>}
                      </button>
                      <button className="ds-btn danger" onClick={() => handleDeleteTrade(trade.id)} disabled={pending}>
                        <Trash2 size={13} /> Remover
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="ds-btn primary">
                        <ArrowLeftRight size={13} /> Propor troca
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent
          className="text-white p-0 overflow-visible"
          style={{ background: "var(--bg-card)", border: "1px solid var(--line-2)", borderRadius: 22, maxWidth: 460, width: "calc(100% - 40px)" }}
        >
          <div style={{ padding: 28 }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 4 }}>
                {editingTrade ? "Editar" : "Nova troca"}
              </div>
              <DialogTitle style={{ fontFamily: "var(--font-bebas)", fontSize: 32, letterSpacing: "0.04em", color: "var(--ink-0)", lineHeight: 1, margin: 0 }}>
                {editingTrade ? "Editar Troca" : "Publicar Troca"}
              </DialogTitle>
            </div>

            {/* Card previews */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center", marginBottom: 24 }}>
              <div
                className={cn("modal-card-preview", !dialogOfferingSticker && "empty")}
                style={dialogOfferingSticker ? { "--country-bg": countryGradient(dialogOfferingSticker.countryCode) } as React.CSSProperties : {}}
              >
                {dialogOfferingSticker ? (
                  <>
                    <div>
                      <div className="sticker-num">{dialogOfferingSticker.number}</div>
                      <div className="sticker-code">{dialogOfferingSticker.countryCode}</div>
                    </div>
                    <div className="sticker-country" style={{ fontSize: 11 }}>
                      {ALL_COUNTRIES.find((c) => c.code === dialogOfferingSticker.countryCode)?.flag}{" "}
                      <span>{dialogOfferingSticker.code}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", color: "var(--ink-3)" }}>
                    <div style={{ fontFamily: "var(--font-bebas)", fontSize: 32, lineHeight: 1 }}>?</div>
                    <div style={{ fontSize: 10, letterSpacing: "0.1em", marginTop: 4 }}>OFEREÇO</div>
                  </div>
                )}
              </div>

              <div className="swap-icon" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }}>
                <ArrowLeftRight size={18} />
              </div>

              <div
                className={cn("modal-card-preview", !dialogWantingSticker && "empty")}
                style={dialogWantingSticker ? { "--country-bg": countryGradient(dialogWantingSticker.countryCode) } as React.CSSProperties : {}}
              >
                {dialogWantingSticker ? (
                  <>
                    <div>
                      <div className="sticker-num">{dialogWantingSticker.number}</div>
                      <div className="sticker-code">{dialogWantingSticker.countryCode}</div>
                    </div>
                    <div className="sticker-country" style={{ fontSize: 11 }}>
                      {ALL_COUNTRIES.find((c) => c.code === dialogWantingSticker.countryCode)?.flag}{" "}
                      <span>{dialogWantingSticker.code}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", color: "var(--ink-3)" }}>
                    <div style={{ fontFamily: "var(--font-bebas)", fontSize: 32, lineHeight: 1 }}>?</div>
                    <div style={{ fontSize: 10, letterSpacing: "0.1em", marginTop: 4 }}>QUERO</div>
                  </div>
                )}
              </div>
            </div>

            {/* Search fields + note + submit */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <StickerSearchField
                label="Figurinha que ofereço"
                placeholder="Buscar ex: BRA 5, Brasil..."
                searchValue={offeringSearch}
                selectedId={offeringId}
                onSearchChange={(v) => { setOfferingSearch(v); setOfferingId("") }}
                onSelect={(id, code) => { setOfferingId(id); setOfferingSearch(code) }}
              />
              <StickerSearchField
                label="Figurinha que quero"
                placeholder="Buscar ex: ARG 10, Argentina..."
                searchValue={wantingSearch}
                selectedId={wantingId}
                onSearchChange={(v) => { setWantingSearch(v); setWantingId("") }}
                onSelect={(id, code) => { setWantingId(id); setWantingSearch(code) }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-2)" }}>
                  Observação (opcional)
                </label>
                <textarea
                  placeholder="Ex: Aceito outras trocas, whatsapp (11) 99999..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", color: "var(--ink-0)", fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none", width: "100%", boxSizing: "border-box", transition: "border-color .15s, box-shadow .15s" }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--line-2)"; e.target.style.boxShadow = "0 0 0 3px rgba(255,255,255,0.04)" }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--line)"; e.target.style.boxShadow = "none" }}
                />
              </div>
              <button
                onClick={editingTrade ? handleEditTrade : handleCreateTrade}
                disabled={pending || !offeringId || !wantingId}
                className="ds-btn primary"
                style={{ width: "100%", justifyContent: "center", padding: "14px", borderRadius: 12, fontSize: 15 }}
              >
                {pending ? "Salvando..." : editingTrade ? "Salvar Alterações" : "Publicar Troca"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
