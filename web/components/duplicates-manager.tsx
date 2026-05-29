"use client"

import { useState, useTransition, useMemo } from "react"
import { ALL_STICKERS, GROUPS, ALL_COUNTRIES, countryGradient, type Sticker } from "@/lib/data/stickers"
import CountryFlag from "@/components/country-flag"
import { createClient } from "@/lib/supabase/client"
import { useDupesCount } from "@/components/dupes-count-context"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Search, Minus, Plus, Repeat2, Share2 } from "lucide-react"
import { shareViaWhatsApp } from "@/lib/share"

interface Props {
  userId: string
  initialDuplicates: Map<string, number>
}

export default function DuplicatesManager({ userId, initialDuplicates }: Props) {
  const [duplicates, setDuplicates] = useState<Map<string, number>>(initialDuplicates)
  const [filter, setFilter] = useState<"all" | "has">("all")
  const [search, setSearch] = useState("")
  const [, startTransition] = useTransition()
  const supabase = createClient()
  const { setDupesCount } = useDupesCount()

  const totalDupes = useMemo(
    () => Array.from(duplicates.values()).reduce((a, b) => a + b, 0),
    [duplicates]
  )
  const dupesWithCount = Array.from(duplicates.keys()).length

  async function updateQuantity(stickerId: string, delta: number) {
    const current = duplicates.get(stickerId) ?? 0
    const next = Math.max(0, current + delta)
    const newMap = new Map(duplicates)
    if (next === 0) newMap.delete(stickerId)
    else newMap.set(stickerId, next)
    setDuplicates(newMap)
    setDupesCount(Array.from(newMap.values()).reduce((a, b) => a + b, 0))

    const snapshot = new Map(duplicates)
    startTransition(async () => {
      if (next === 0) {
        const { error } = await supabase.from("user_duplicates").delete()
          .eq("user_id", userId).eq("sticker_id", stickerId)
        if (error) { setDuplicates(snapshot); toast.error("Erro ao atualizar repetidas") }
      } else {
        const { error } = await supabase.from("user_duplicates")
          .upsert(
            { user_id: userId, sticker_id: stickerId, quantity: next },
            { onConflict: "user_id,sticker_id" }
          )
        if (error) { setDuplicates(snapshot); toast.error("Erro ao atualizar repetidas") }
      }
    })
  }

  function exportToWhatsApp() {
    const withDupes = ALL_STICKERS.filter((s) => (duplicates.get(s.id) ?? 0) > 0)
    if (withDupes.length === 0) { toast.error("Você não tem repetidas ainda"); return }

    // Group by country
    const byCountry = new Map<string, typeof withDupes>()
    for (const s of withDupes) {
      if (!byCountry.has(s.countryCode)) byCountry.set(s.countryCode, [])
      byCountry.get(s.countryCode)!.push(s)
    }

    const totalUnits = Array.from(duplicates.values()).reduce((a, b) => a + b, 0)

    let msg = `🔄 *Minhas Repetidas — Copa 2026*\n`
    msg += `_(${withDupes.length} figurinha${withDupes.length !== 1 ? "s" : ""}, ${totalUnits} unidade${totalUnits !== 1 ? "s" : ""})_\n\n`

    for (const [, stickers] of byCountry) {
      const group = stickers[0].group
      const info  = ALL_COUNTRIES.find((c) => c.code === stickers[0].countryCode)
      const flag  = group === "FWC" ? "🏆" : group === "CC" ? "🥤" : (info?.flag ?? "")
      msg += `${flag} *${stickers[0].country}*\n`
      for (const s of stickers) {
        const qty  = duplicates.get(s.id) ?? 0
        const name = s.playerName && group !== "CC" ? ` — ${s.playerName}` : ""
        msg += `  • ${s.code}${name} ×${qty}\n`
      }
      msg += "\n"
    }

    msg += `_Quer trocar? Me chama!_ 🤝`

    shareViaWhatsApp(msg)
  }

  const filteredStickers = useMemo(() => {
    return ALL_STICKERS.filter((s) => {
      if (filter === "has" && (duplicates.get(s.id) ?? 0) === 0) return false
      if (search) {
        const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
        const q = norm(search)
        return norm(s.code).includes(q) || norm(s.country).includes(q)
      }
      return true
    })
  }, [search, filter, duplicates])

  const byGroup = useMemo(() => {
    const map = new Map<string, { label: string; flag: string; iso?: string; stickers: Sticker[] }>()
    for (const s of filteredStickers) {
      if (!map.has(s.countryCode)) {
        const info = ALL_COUNTRIES.find((c) => c.code === s.countryCode)
        map.set(s.countryCode, { label: s.country, flag: info?.flag ?? "🏆", iso: info?.iso, stickers: [] })
      }
      map.get(s.countryCode)!.stickers.push(s)
    }
    return map
  }, [filteredStickers])

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 6 }}>
          Suas duplicadas
        </div>
        <div className="flex items-start justify-between gap-4">
          <h1 style={{ fontFamily: "var(--font-bebas)", fontSize: 56, letterSpacing: "0.02em", lineHeight: 0.95, margin: 0, color: "var(--ink-0)" }}>
            Figurinhas <span style={{ color: "var(--gold)" }}>Repetidas</span>
          </h1>
          {totalDupes > 0 && (
            <button
              onClick={exportToWhatsApp}
              className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 shrink-0"
              style={{ background: "#25D366", color: "#fff" }}
              title="Exportar para WhatsApp"
            >
              <Share2 size={15} />
              WhatsApp
            </button>
          )}
        </div>
        <p style={{ color: "var(--ink-2)", marginTop: 8, fontSize: 14 }}>
          Use + e − para registrar quantas repetidas você tem. Publique direto na troca com 1 clique.
        </p>
      </div>

      {/* Hero */}
      <div className="progress-hero" style={{ padding: "20px 28px" }}>
        <div className="ph-row">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div className="stat-icon gold" style={{ width: 56, height: 56, borderRadius: 14 }}>
              <Repeat2 size={26} />
            </div>
            <div>
              <div className="ph-label">Total de Repetidas</div>
              <div className="ph-count" style={{ fontSize: 48 }}>
                {totalDupes}<span className="ph-of"> figurinha{totalDupes !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search + filter */}
      <div className="search-row">
        <div className="search-box">
          <Search size={15} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
          <input
            placeholder="Buscar por seleção ou código…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="pills">
          <button className={cn("pill", filter === "all" && "active")} onClick={() => setFilter("all")}>
            Todas
          </button>
          <button className={cn("pill", filter === "has" && "active")} onClick={() => setFilter("has")}>
            Com repetidas <span className="count">{dupesWithCount}</span>
          </button>
        </div>
      </div>

      {/* Groups */}
      {Array.from(byGroup.entries()).map(([code, { label, flag, iso, stickers }]) => (
        <div key={code} className="group-section">
          <div className="group-head">
            <div className="group-icon">
              {iso ? <CountryFlag iso={iso} name={label} size={28} /> : flag}
            </div>
            <div className="group-title">{label}</div>
          </div>

          <div className="dupe-list">
            {stickers.map((sticker) => {
              const count = duplicates.get(sticker.id) ?? 0
              const has = count > 0
              return (
                <div key={sticker.id} className={cn("dupe-card", has && "has-dupes")}>
                  <div
                    className="dupe-mini"
                    style={{ "--country-bg": countryGradient(sticker.countryCode) } as React.CSSProperties}
                  >
                    {sticker.number}
                  </div>

                  <div className="dupe-info">
                    <div className="dupe-info-t">{sticker.code}</div>
                    <div className="dupe-info-s" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {iso ? <CountryFlag iso={iso} name={label} size={14} /> : flag} {sticker.country}
                    </div>
                  </div>

                  <div className="counter">
                    <button onClick={() => updateQuantity(sticker.id, -1)} disabled={count === 0}>
                      <Minus size={12} />
                    </button>
                    <span className={cn("counter-val", has && "has")}>{count}</span>
                    <button onClick={() => updateQuantity(sticker.id, 1)}>
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {filteredStickers.length === 0 && (
        <div className="ds-empty">
          <div className="ds-empty-icon">🔍</div>
          <div>Nenhuma figurinha encontrada</div>
        </div>
      )}
    </div>
  )
}
