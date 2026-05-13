"use client"

import { useState, useTransition, useMemo, useCallback } from "react"
import { ALL_STICKERS, ALL_COUNTRIES, GROUPS, countryGradient, type Sticker } from "@/lib/data/stickers"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Search, Check } from "lucide-react"
import CountryFlag from "@/components/country-flag"

type Filter = "all" | "owned" | "missing"

interface Props {
  userId: string
  initialOwned: Set<string>
  initialDuplicates?: Map<string, number>
}

const MILESTONES = [25, 50, 75, 100]

function fireConfetti(x: number, y: number) {
  const colors = ["#FFD23F", "#FFB800", "#34D399", "#A78BFA", "#F472B6", "#38BDF8", "#FF6B6B"]
  const burst = document.createElement("div")
  burst.style.cssText = `position:fixed;left:${x}px;top:${y}px;pointer-events:none;z-index:9999;`
  for (let i = 0; i < 24; i++) {
    const p = document.createElement("div")
    const angle = Math.random() * Math.PI * 2
    const dist = 60 + Math.random() * 120
    p.style.cssText = `position:absolute;width:8px;height:12px;border-radius:2px;background:${colors[i % colors.length]};animation:confetti-burst 1.4s ease-out forwards;animation-delay:${(Math.random() * 0.1).toFixed(2)}s;`
    p.style.setProperty("--tx", `${Math.cos(angle) * dist}px`)
    p.style.setProperty("--ty", `${Math.sin(angle) * dist}px`)
    p.style.setProperty("--tr", `${Math.random() * 720 - 360}deg`)
    burst.appendChild(p)
  }
  document.body.appendChild(burst)
  setTimeout(() => burst.remove(), 1600)
}

export default function CollectionGrid({ userId, initialOwned, initialDuplicates }: Props) {
  const [owned, setOwned] = useState<Set<string>>(initialOwned)
  const [dupes] = useState<Map<string, number>>(initialDuplicates ?? new Map())
  const [filter, setFilter] = useState<Filter>("all")
  const [search, setSearch] = useState("")
  const [pending, startTransition] = useTransition()
  const supabase = createClient()

  const toggleSticker = useCallback((stickerId: string, rect: DOMRect) => {
    const isOwned = owned.has(stickerId)
    const next = new Set(owned)

    if (isOwned) {
      next.delete(stickerId)
      setOwned(next)
      startTransition(async () => {
        const { error } = await supabase.from("user_collection").delete()
          .eq("user_id", userId).eq("sticker_id", stickerId)
        if (error) { setOwned(owned); toast.error("Erro ao atualizar coleção") }
      })
    } else {
      next.add(stickerId)
      setOwned(next)
      fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2)

      const prevPct = Math.round((owned.size / ALL_STICKERS.length) * 100)
      const newPct  = Math.round((next.size  / ALL_STICKERS.length) * 100)
      const milestone = MILESTONES.find(m => prevPct < m && newPct >= m)
      if (milestone) {
        toast.success(`🎉 ${milestone}% completo!`, { duration: 3500 })
      } else {
        toast.success("✓ Figurinha colada!", { duration: 1800 })
      }

      startTransition(async () => {
        const { error } = await supabase.from("user_collection")
          .upsert({ user_id: userId, sticker_id: stickerId })
        if (error) { setOwned(owned); toast.error("Erro ao atualizar coleção") }
      })
    }
  }, [owned, userId, supabase])

  const totalOwned   = owned.size
  const totalStickers = ALL_STICKERS.length
  const progressPct  = totalStickers ? (totalOwned / totalStickers) * 100 : 0

  const sections = useMemo(() => {
    const result: Array<{ key: string; label: string; flag: string; iso?: string; stickers: Sticker[] }> = []
    result.push({ key: "FWC", label: "FIFA World Cup — História",  flag: "🏆", stickers: ALL_STICKERS.filter((s) => s.group === "FWC") })
    result.push({ key: "CC",  label: "Coca-Cola — Estrelas",       flag: "🥤", stickers: ALL_STICKERS.filter((s) => s.group === "CC") })
    for (const [, countries] of Object.entries(GROUPS)) {
      for (const country of countries) {
        result.push({ key: country.code, label: country.name, flag: country.flag, iso: country.iso, stickers: ALL_STICKERS.filter((s) => s.countryCode === country.code) })
      }
    }
    return result
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 6 }}>
          Sua coleção
        </div>
        <h1 style={{ fontFamily: "var(--font-bebas)", fontSize: 56, letterSpacing: "0.02em", lineHeight: 0.95, margin: 0, color: "var(--ink-0)" }}>
          Minha <span style={{ color: "var(--gold)" }}>Coleção</span>
        </h1>
        <p style={{ color: "var(--ink-2)", marginTop: 8, fontSize: 14 }}>
          Toque em uma figurinha para colar no álbum. Clique novamente para descolar.
        </p>
      </div>

      {/* Progress Hero */}
      <div className="progress-hero">
        <div className="ph-row">
          <div>
            <div className="ph-label">Progresso Total</div>
            <div className="ph-count">
              {totalOwned}<span className="ph-of"> / {totalStickers}</span>
            </div>
          </div>
          <div className="ph-pct">{Math.round(progressPct)}%</div>
        </div>
        <div className="bar">
          <div className="bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="milestones">
          {MILESTONES.map((m) => (
            <div key={m} className={cn("milestone", progressPct >= m && "hit")} style={{ left: `${m}%` }}>
              <div className="dot" />
              {m}%
            </div>
          ))}
        </div>
      </div>

      {/* Search + Filter */}
      <div className="search-row">
        <div className="search-box">
          <Search size={15} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
          <input
            placeholder="Buscar seleção, número ou grupo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="kbd">⌘K</span>
        </div>
        <div className="pills">
          {(["all", "owned", "missing"] as Filter[]).map((f) => (
            <button key={f} className={cn("pill", filter === f && "active")} onClick={() => setFilter(f)}>
              {f === "all" ? "Todas" : f === "owned" ? "✓ Tenho" : "○ Faltam"}
              <span className="count">
                {f === "all" ? totalStickers : f === "owned" ? totalOwned : totalStickers - totalOwned}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      {sections.map(({ key, label, flag, iso, stickers }) => {
        const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
        const searchLower = norm(search)
        const matchesSearch =
          search === "" ||
          norm(label).includes(searchLower) ||
          norm(key).includes(searchLower)
        if (!matchesSearch) return null

        const sectionOwned = stickers.filter((s) => owned.has(s.id)).length
        const visibleStickers = stickers.filter((s) => {
          if (filter === "owned")   return owned.has(s.id)
          if (filter === "missing") return !owned.has(s.id)
          return true
        })
        if (visibleStickers.length === 0) return null

        const sectionPct = stickers.length ? (sectionOwned / stickers.length) * 100 : 0

        return (
          <div key={key} className="group-section">
            <div className="group-head">
              <div className="group-icon">
                {iso ? <CountryFlag iso={iso} name={label} size={28} /> : flag}
              </div>
              <div>
                <div className="group-title">{label}</div>
                <div className="group-meta">{sectionOwned} de {stickers.length} coletadas</div>
              </div>
              <div className="group-progress">
                <div className="group-progress-bar">
                  <div className="group-progress-fill" style={{ width: `${sectionPct}%` }} />
                </div>
                <div className="group-progress-pct">{Math.round(sectionPct)}%</div>
              </div>
            </div>

            <div className="stickers-grid">
              {visibleStickers.map((sticker) => {
                const isOwned    = owned.has(sticker.id)
                const dupeCount  = dupes.get(sticker.id) ?? 0
                const isSpecial  = sticker.type === "history" && sticker.number === 1 && sticker.countryCode !== "FWC"
                const countryInfo = ALL_COUNTRIES.find((c) => c.code === sticker.countryCode)

                return (
                  <button
                    key={sticker.id}
                    onClick={(e) => toggleSticker(sticker.id, e.currentTarget.getBoundingClientRect())}
                    title={`${sticker.code} — ${sticker.country}`}
                    disabled={pending}
                    className={cn(
                      "sticker-card",
                      isOwned ? (isSpecial ? "collected special" : "collected") : "empty"
                    )}
                    style={isOwned
                      ? { "--country-bg": countryGradient(sticker.countryCode) } as React.CSSProperties
                      : undefined
                    }
                  >
                    {isOwned && dupeCount > 0 && (
                      <span className="dupe-badge">×{dupeCount + 1}</span>
                    )}
                    {isOwned && dupeCount === 0 && (
                      <span className="sticker-check">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}

                    <div>
                      <div className="sticker-num">{sticker.number}</div>
                      <div className="sticker-code">{sticker.countryCode}</div>
                    </div>

                    <div className="sticker-country">
                      {sticker.playerName ? (
                        <span className="sticker-player">{sticker.playerName}</span>
                      ) : (
                        <>
                          {countryInfo?.iso
                            ? <CountryFlag iso={countryInfo.iso} name={sticker.country} size={16} />
                            : countryInfo?.flag && <span className="sticker-flag">{countryInfo.flag}</span>
                          }
                          <span>{sticker.countryCode}</span>
                        </>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {search !== "" && sections.every(({ key, label }) => {
        const norm = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
        const s = norm(search)
        return !norm(label).includes(s) && !norm(key).includes(s)
      }) && (
        <div className="ds-empty">
          <div className="ds-empty-icon">🔍</div>
          <div>Nenhuma seleção encontrada para &ldquo;{search}&rdquo;</div>
        </div>
      )}
    </div>
  )
}
