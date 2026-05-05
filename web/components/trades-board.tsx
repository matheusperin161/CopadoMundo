"use client"

import { useState, useTransition } from "react"
import { ALL_STICKERS, ALL_COUNTRIES } from "@/lib/data/stickers"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Plus, RefreshCw, Trash2, Search, ArrowLeftRight } from "lucide-react"

interface Trade {
  id: string
  user_id: string
  offering_sticker_id: string
  wanting_sticker_id: string
  note: string | null
  status: string
  created_at: string
  profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface Props {
  userId: string
  initialTrades: Trade[]
}

function StickerPill({ stickerId, label }: { stickerId: string; label: string }) {
  const sticker = ALL_STICKERS.find((s) => s.id === stickerId)
  const country = sticker ? ALL_COUNTRIES.find((c) => c.code === sticker.countryCode) : null
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-white/40 text-xs uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/10">
        {country?.flag && <span className="text-lg">{country.flag}</span>}
        <div>
          <p className="text-white font-bold text-sm leading-none">{sticker?.code ?? stickerId}</p>
          <p className="text-white/40 text-xs mt-0.5">{sticker?.country ?? ""}</p>
        </div>
      </div>
    </div>
  )
}

export default function TradesBoard({ userId, initialTrades }: Props) {
  const [trades, setTrades] = useState<Trade[]>(initialTrades)
  const [openDialog, setOpenDialog] = useState(false)
  const [searchFilter, setSearchFilter] = useState("")
  const [pending, startTransition] = useTransition()

  // New trade form
  const [offeringId, setOfferingId] = useState("")
  const [wantingId, setWantingId] = useState("")
  const [note, setNote] = useState("")
  const [offeringSearch, setOfferingSearch] = useState("")
  const [wantingSearch, setWantingSearch] = useState("")

  const supabase = createClient()

  const filteredTrades = trades.filter((t) => {
    if (!searchFilter) return true
    const s = searchFilter.toLowerCase()
    const offering = ALL_STICKERS.find((x) => x.id === t.offering_sticker_id)
    const wanting = ALL_STICKERS.find((x) => x.id === t.wanting_sticker_id)
    return (
      offering?.code.toLowerCase().includes(s) ||
      offering?.country.toLowerCase().includes(s) ||
      wanting?.code.toLowerCase().includes(s) ||
      wanting?.country.toLowerCase().includes(s) ||
      (t.profiles?.full_name?.toLowerCase().includes(s) ?? false)
    )
  })

  const offeringSuggestions = ALL_STICKERS.filter((s) =>
    offeringSearch.length >= 2 &&
    (s.code.toLowerCase().includes(offeringSearch.toLowerCase()) ||
      s.country.toLowerCase().includes(offeringSearch.toLowerCase()))
  ).slice(0, 6)

  const wantingSuggestions = ALL_STICKERS.filter((s) =>
    wantingSearch.length >= 2 &&
    (s.code.toLowerCase().includes(wantingSearch.toLowerCase()) ||
      s.country.toLowerCase().includes(wantingSearch.toLowerCase()))
  ).slice(0, 6)

  async function handleCreateTrade() {
    if (!offeringId || !wantingId) {
      toast.error("Selecione as duas figurinhas")
      return
    }

    startTransition(async () => {
      const { data: inserted, error } = await supabase
        .from("trades")
        .insert({
          user_id: userId,
          offering_sticker_id: offeringId,
          wanting_sticker_id: wantingId,
          note: note || null,
          status: "open",
        })
        .select()
        .single()

      if (error) {
        toast.error("Erro ao criar troca")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", userId)
        .single()

      const newTrade: Trade = { ...inserted, profiles: profile ?? null }
      setTrades([newTrade, ...trades])
      setOpenDialog(false)
      setOfferingId("")
      setWantingId("")
      setNote("")
      setOfferingSearch("")
      setWantingSearch("")
      toast.success("Troca publicada!")
    })
  }

  async function handleDeleteTrade(tradeId: string) {
    startTransition(async () => {
      const { error } = await supabase
        .from("trades")
        .delete()
        .eq("id", tradeId)
        .eq("user_id", userId)

      if (error) {
        toast.error("Erro ao remover troca")
        return
      }

      setTrades(trades.filter((t) => t.id !== tradeId))
      toast.success("Troca removida")
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <Input
            placeholder="Buscar por seleção, figurinha ou usuário..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <button
          onClick={() => setOpenDialog(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[#0A1628] text-sm transition-all hover:scale-105 active:scale-95"
          style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)" }}
        >
          <Plus size={16} />
          Publicar Troca
        </button>
      </div>

      {/* Trades grid */}
      {filteredTrades.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <RefreshCw size={40} className="text-white/20" />
          <div>
            <p className="text-white/40 font-medium">Nenhuma troca disponível</p>
            <p className="text-white/20 text-sm mt-1">Seja o primeiro a publicar uma troca!</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTrades.map((trade) => {
            const isOwn = trade.user_id === userId
            const initials = (trade.profiles?.full_name ?? "U")
              .split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()

            return (
              <div
                key={trade.id}
                className={cn(
                  "flex flex-col gap-4 p-5 rounded-2xl border transition-all",
                  isOwn ? "border-[#FFD700]/30 bg-[#FFD700]/5" : "border-white/10 bg-white/5 hover:bg-white/[0.08]"
                )}
              >
                {/* User */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarImage src={trade.profiles?.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-[#FFD700]/20 text-[#FFD700] text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white text-sm font-medium leading-none">
                        {trade.profiles?.full_name ?? "Usuário"}
                      </p>
                      <p className="text-white/30 text-xs mt-0.5">
                        {new Date(trade.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwn && (
                      <Badge className="bg-[#FFD700]/20 text-[#FFD700] border-0 text-xs">Minha</Badge>
                    )}
                    <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">Aberta</Badge>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Stickers */}
                <div className="flex items-center justify-between gap-3">
                  <StickerPill stickerId={trade.offering_sticker_id} label="Ofereço" />
                  <ArrowLeftRight size={18} className="text-white/20 shrink-0 mt-4" />
                  <StickerPill stickerId={trade.wanting_sticker_id} label="Quero" />
                </div>

                {/* Note */}
                {trade.note && (
                  <p className="text-white/50 text-xs italic bg-white/5 rounded-lg px-3 py-2">
                    &ldquo;{trade.note}&rdquo;
                  </p>
                )}

                {/* Actions */}
                {isOwn && (
                  <button
                    onClick={() => handleDeleteTrade(trade.id)}
                    disabled={pending}
                    className="flex items-center gap-2 text-red-400/60 hover:text-red-400 transition-colors text-xs self-end"
                  >
                    <Trash2 size={12} />
                    Remover
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create trade dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="bg-[#0d1f3c] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-black text-2xl" style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.05em" }}>
              Publicar Troca
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-5 pt-2">
            {/* Offering sticker */}
            <div className="flex flex-col gap-2">
              <label className="text-white/60 text-xs uppercase tracking-widest">Figurinha que ofereço</label>
              <div className="relative">
                <Input
                  placeholder="Buscar ex: BRA 5, Brasil..."
                  value={offeringSearch}
                  onChange={(e) => { setOfferingSearch(e.target.value); setOfferingId("") }}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
                {offeringId && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FFD700] text-xs font-bold">✓</span>
                )}
              </div>
              {offeringSuggestions.length > 0 && !offeringId && (
                <div className="flex flex-col rounded-xl border border-white/10 overflow-hidden">
                  {offeringSuggestions.map((s) => {
                    const c = ALL_COUNTRIES.find((x) => x.code === s.countryCode)
                    return (
                      <button
                        key={s.id}
                        onClick={() => { setOfferingId(s.id); setOfferingSearch(s.code) }}
                        className="flex items-center gap-3 px-3 py-2.5 text-left bg-white/5 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                      >
                        {c?.flag && <span>{c.flag}</span>}
                        <span className="text-white font-bold text-sm">{s.code}</span>
                        <span className="text-white/40 text-xs">{s.country}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Wanting sticker */}
            <div className="flex flex-col gap-2">
              <label className="text-white/60 text-xs uppercase tracking-widest">Figurinha que quero</label>
              <div className="relative">
                <Input
                  placeholder="Buscar ex: ARG 10, Argentina..."
                  value={wantingSearch}
                  onChange={(e) => { setWantingSearch(e.target.value); setWantingId("") }}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
                {wantingId && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FFD700] text-xs font-bold">✓</span>
                )}
              </div>
              {wantingSuggestions.length > 0 && !wantingId && (
                <div className="flex flex-col rounded-xl border border-white/10 overflow-hidden">
                  {wantingSuggestions.map((s) => {
                    const c = ALL_COUNTRIES.find((x) => x.code === s.countryCode)
                    return (
                      <button
                        key={s.id}
                        onClick={() => { setWantingId(s.id); setWantingSearch(s.code) }}
                        className="flex items-center gap-3 px-3 py-2.5 text-left bg-white/5 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                      >
                        {c?.flag && <span>{c.flag}</span>}
                        <span className="text-white font-bold text-sm">{s.code}</span>
                        <span className="text-white/40 text-xs">{s.country}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Note */}
            <div className="flex flex-col gap-2">
              <label className="text-white/60 text-xs uppercase tracking-widest">Observação (opcional)</label>
              <Textarea
                placeholder="Ex: Aceito outras trocas, whatsapp (11) 99999..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleCreateTrade}
              disabled={pending || !offeringId || !wantingId}
              className="w-full py-3 rounded-xl font-bold text-[#0A1628] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)" }}
            >
              {pending ? "Publicando..." : "Publicar Troca"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
