"use client"

import { useState, useTransition, useMemo } from "react"
import { ALL_STICKERS, GROUPS, ALL_COUNTRIES, type Sticker, type StickerType } from "@/lib/data/stickers"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Search, Minus, Plus, Repeat2 } from "lucide-react"
import CountryFlag from "@/components/country-flag"

function getStickerTypeLabel(type: StickerType) {
  if (type === "badge") return "Escudo"
  if (type === "team_photo") return "Foto Time"
  if (type === "history") return "História"
  return "Jogador"
}

interface DuplicateRow {
  stickerId: string
  quantity: number
}

interface Props {
  userId: string
  initialDuplicates: Map<string, number>
}

export default function DuplicatesManager({ userId, initialDuplicates }: Props) {
  const [duplicates, setDuplicates] = useState<Map<string, number>>(initialDuplicates)
  const [search, setSearch] = useState("")
  const [selectedCountry, setSelectedCountry] = useState<string>("ALL")
  const [, startTransition] = useTransition()
  const supabase = createClient()

  const totalDuplicates = Array.from(duplicates.values()).reduce((a, b) => a + b, 0)

  async function updateQuantity(stickerId: string, delta: number) {
    const current = duplicates.get(stickerId) ?? 0
    const next = Math.max(0, current + delta)

    const newMap = new Map(duplicates)
    if (next === 0) {
      newMap.delete(stickerId)
    } else {
      newMap.set(stickerId, next)
    }
    setDuplicates(newMap)

    startTransition(async () => {
      if (next === 0) {
        const { error } = await supabase
          .from("user_duplicates")
          .delete()
          .eq("user_id", userId)
          .eq("sticker_id", stickerId)
        if (error) {
          setDuplicates(duplicates)
          toast.error("Erro ao atualizar repetidas")
        }
      } else {
        const { error } = await supabase
          .from("user_duplicates")
          .upsert({ user_id: userId, sticker_id: stickerId, quantity: next, updated_at: new Date().toISOString() })
        if (error) {
          setDuplicates(duplicates)
          toast.error("Erro ao atualizar repetidas")
        }
      }
    })
  }

  const filteredStickers = useMemo(() => {
    return ALL_STICKERS.filter((s) => {
      const matchesCountry = selectedCountry === "ALL" || s.countryCode === selectedCountry
      const matchesSearch = search === "" ||
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        s.country.toLowerCase().includes(search.toLowerCase())
      return matchesCountry && matchesSearch
    })
  }, [search, selectedCountry])

  // Group filtered stickers by country
  const grouped = useMemo(() => {
    const map = new Map<string, { country: string; flag: string; stickers: Sticker[] }>()
    for (const s of filteredStickers) {
      if (!map.has(s.countryCode)) {
        const info = ALL_COUNTRIES.find((c) => c.code === s.countryCode)
        map.set(s.countryCode, {
          country: s.country,
          flag: info?.flag ?? "",
          stickers: [],
        })
      }
      map.get(s.countryCode)!.stickers.push(s)
    }
    return map
  }, [filteredStickers])

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-white/5">
        <div className="size-12 rounded-xl bg-[#FFD700]/15 flex items-center justify-center">
          <Repeat2 className="text-[#FFD700]" size={22} />
        </div>
        <div>
          <p className="text-white/50 text-xs uppercase tracking-widest">Total de repetidas</p>
          <p className="text-white font-black text-3xl leading-none" style={{ fontFamily: "var(--font-bebas)" }}>
            {totalDuplicates} <span className="text-white/30 text-lg">figurinhas</span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <Input
            placeholder="Buscar por código ou seleção..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#FFD700]/30"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCountry("ALL")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
              selectedCountry === "ALL"
                ? "bg-[#FFD700] text-[#0A1628]"
                : "bg-white/5 text-white/50 hover:text-white border border-white/10"
            )}
          >
            Todas
          </button>
          {/* FWC */}
          <button
            onClick={() => setSelectedCountry("FWC")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
              selectedCountry === "FWC"
                ? "bg-[#FFD700] text-[#0A1628]"
                : "bg-white/5 text-white/50 hover:text-white border border-white/10"
            )}
          >
            🏆 FWC
          </button>
          {Object.entries(GROUPS).map(([, countries]) =>
            countries.map((c) => (
              <button
                key={c.code}
                onClick={() => setSelectedCountry(c.code)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  selectedCountry === c.code
                    ? "bg-[#FFD700] text-[#0A1628]"
                    : "bg-white/5 text-white/50 hover:text-white border border-white/10"
                )}
              >
                <CountryFlag iso={c.iso} name={c.name} size={14} />
                {c.code}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Sticker list */}
      {Array.from(grouped.entries()).map(([code, { country, flag, stickers }]) => {
        const countryDups = stickers.filter((s) => (duplicates.get(s.id) ?? 0) > 0).length
        return (
          <div key={code} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {flag && <span>{flag}</span>}
              <span className="text-white font-semibold text-sm">{country}</span>
              {countryDups > 0 && (
                <Badge className="bg-[#FFD700]/20 text-[#FFD700] border-0 text-xs">{countryDups} repetidas</Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {stickers.map((sticker) => {
                const qty = duplicates.get(sticker.id) ?? 0
                return (
                  <div
                    key={sticker.id}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl border transition-all",
                      qty > 0
                        ? "border-[#FFD700]/30 bg-[#FFD700]/10"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                    )}
                  >
                    <div className="flex flex-col">
                      <span className={cn("font-bold text-sm", qty > 0 ? "text-[#FFD700]" : "text-white/60")}>
                        {sticker.code}
                      </span>
                      <span className="text-white/30 text-xs">{getStickerTypeLabel(sticker.type)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(sticker.id, -1)}
                        disabled={qty === 0}
                        className="size-7 rounded-lg border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus size={12} />
                      </button>
                      <span className={cn("w-6 text-center text-sm font-bold", qty > 0 ? "text-[#FFD700]" : "text-white/30")}>
                        {qty}
                      </span>
                      <button
                        onClick={() => updateQuantity(sticker.id, 1)}
                        className="size-7 rounded-lg border border-white/10 flex items-center justify-center text-white/50 hover:text-[#FFD700] hover:border-[#FFD700]/30 transition-all"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {filteredStickers.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-4xl">🔍</span>
          <p className="text-white/40">Nenhuma figurinha encontrada</p>
        </div>
      )}
    </div>
  )
}
