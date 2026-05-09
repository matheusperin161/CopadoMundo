"use client"

import { useState, useTransition, useMemo } from "react"
import { ALL_STICKERS, GROUPS, type Sticker } from "@/lib/data/stickers"
import { createClient } from "@/lib/supabase/client"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import CountryFlag from "@/components/country-flag"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Check, Search } from "lucide-react"

type Filter = "all" | "owned" | "missing"

interface Props {
  userId: string
  initialOwned: Set<string>
}

function getStickerTypeLabel(type: Sticker["type"]) {
  if (type === "badge") return "Escudo"
  if (type === "team_photo") return "Foto Time"
  if (type === "history") return "História"
  return "Jogador"
}


export default function CollectionGrid({ userId, initialOwned }: Props) {
  const [owned, setOwned] = useState<Set<string>>(initialOwned)
  const [filter, setFilter] = useState<Filter>("all")
  const [search, setSearch] = useState("")
  const [pending, startTransition] = useTransition()
  const supabase = createClient()

  async function toggleSticker(stickerId: string) {
    const isOwned = owned.has(stickerId)
    const next = new Set(owned)

    if (isOwned) {
      next.delete(stickerId)
      setOwned(next)
      startTransition(async () => {
        const { error } = await supabase
          .from("user_collection")
          .delete()
          .eq("user_id", userId)
          .eq("sticker_id", stickerId)
        if (error) {
          setOwned(owned)
          toast.error("Erro ao atualizar coleção")
        }
      })
    } else {
      next.add(stickerId)
      setOwned(next)
      startTransition(async () => {
        const { error } = await supabase
          .from("user_collection")
          .upsert({ user_id: userId, sticker_id: stickerId })
        if (error) {
          setOwned(owned)
          toast.error("Erro ao atualizar coleção")
        }
      })
    }
  }

  const totalOwned = owned.size
  const totalStickers = ALL_STICKERS.length
  const progressPct = Math.round((totalOwned / totalStickers) * 100)

  const sections = useMemo(() => {
    const result: Array<{
      key: string
      label: string
      iso?: string
      stickers: Sticker[]
    }> = []

    // FWC History — sem bandeira de país
    const fwcStickers = ALL_STICKERS.filter((s) => s.group === "FWC")
    result.push({ key: "FWC", label: "FIFA World Cup — História", stickers: fwcStickers })

    // Countries by group
    for (const [, countries] of Object.entries(GROUPS)) {
      for (const country of countries) {
        const stickers = ALL_STICKERS.filter((s) => s.countryCode === country.code)
        result.push({
          key: country.code,
          label: country.name,
          iso: country.iso,
          stickers,
        })
      }
    }

    return result
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* Progress header */}
      <div className="flex flex-col gap-3 p-5 rounded-2xl border border-white/10 bg-white/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest">Progresso Total</p>
            <p className="text-white font-black text-3xl" style={{ fontFamily: "var(--font-bebas)" }}>
              {totalOwned} <span className="text-white/30 text-xl">/ {totalStickers}</span>
            </p>
          </div>
          <div className="text-5xl font-black leading-none" style={{ fontFamily: "var(--font-bebas)", color: "#FFD700" }}>
            {progressPct}%
          </div>
        </div>
        <Progress value={progressPct} className="h-2 bg-white/10" />
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <Input
            placeholder="Buscar seleção... ex: Brasil, Argentina, França"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#FFD700]/30"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "owned", "missing"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150",
                filter === f
                  ? "bg-[#FFD700] text-[#0A1628]"
                  : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/10"
              )}
            >
              {f === "all" ? "Todas" : f === "owned" ? "✓ Tenho" : "○ Faltam"}
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      {sections.map(({ key, label, iso, stickers }) => {
        const searchLower = search.toLowerCase()
        const matchesSearch =
          search === "" ||
          label.toLowerCase().includes(searchLower) ||
          key.toLowerCase().includes(searchLower)

        if (!matchesSearch) return null

        const sectionOwned = stickers.filter((s) => owned.has(s.id)).length
        const visibleStickers = stickers.filter((s) => {
          if (filter === "owned") return owned.has(s.id)
          if (filter === "missing") return !owned.has(s.id)
          return true
        })

        if (visibleStickers.length === 0) return null

        const sectionPct = Math.round((sectionOwned / stickers.length) * 100)

        return (
          <div key={key} className="flex flex-col gap-3">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Bandeira real via imagem */}
                {iso ? (
                  <CountryFlag iso={iso} name={label} size={22} />
                ) : (
                  <span className="text-lg">🏆</span>
                )}
                <h2 className="text-white font-bold text-sm">{label}</h2>
                <Badge variant="secondary" className="text-xs bg-white/10 text-white/60 border-0">
                  {sectionOwned}/{stickers.length}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${sectionPct}%`, background: sectionPct === 100 ? "#22c55e" : "#FFD700" }}
                  />
                </div>
                <span className="text-white/40 text-xs w-8 text-right">{sectionPct}%</span>
              </div>
            </div>

            {/* Sticker grid */}
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5">
              {visibleStickers.map((sticker) => {
                const isOwned = owned.has(sticker.id)
                return (
                  <button
                    key={sticker.id}
                    onClick={(e) => {
                      const el = e.currentTarget
                      el.classList.add("sticker-pop")
                      setTimeout(() => el.classList.remove("sticker-pop"), 200)
                      toggleSticker(sticker.id)
                    }}
                    title={`${sticker.code} — ${sticker.country}`}
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-lg p-1.5 transition-all duration-150 aspect-[3/4] text-center border select-none",
                      isOwned
                        ? "bg-[#FFD700]/15 border-[#FFD700]/40 hover:bg-[#FFD700]/25 shadow-sm shadow-[#FFD700]/10"
                        : "bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/20",
                      pending && "pointer-events-none"
                    )}
                  >
                    {isOwned && (
                      <div className="absolute top-1 right-1">
                        <Check size={8} className="text-[#FFD700]" strokeWidth={3} />
                      </div>
                    )}

                    {/* Número */}
                    <span className={cn("text-sm font-black leading-none", isOwned ? "text-[#FFD700]" : "text-white/40")}>
                      {sticker.number}
                    </span>

                    {/* Sigla */}
                    <span className={cn("text-[9px] leading-tight mt-0.5 font-bold", isOwned ? "text-white/80" : "text-white/30")}>
                      {sticker.countryCode}
                    </span>

                    {/* Tipo */}
                    <span className={cn("text-[7px] leading-tight mt-0.5 font-medium", isOwned ? "text-[#FFD700]/60" : "text-white/20")}>
                      {getStickerTypeLabel(sticker.type)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {search !== "" && sections.every(({ key, label }) => {
        const s = search.toLowerCase()
        return !label.toLowerCase().includes(s) && !key.toLowerCase().includes(s)
      }) && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-4xl">🔍</span>
          <p className="text-white/40">Nenhuma seleção encontrada para &ldquo;{search}&rdquo;</p>
        </div>
      )}
    </div>
  )
}
