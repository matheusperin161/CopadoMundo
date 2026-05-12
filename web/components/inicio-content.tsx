"use client"

import Link from "next/link"
import { BookOpen, Repeat2, RefreshCw, Flame } from "lucide-react"
import { countryGradient, ALL_COUNTRIES, ALL_STICKERS, type Sticker } from "@/lib/data/stickers"
import CountryFlag from "@/components/country-flag"

interface MatchingTrade {
  id: string
  user_id: string
  offering_sticker_id: string
  wanting_sticker_id: string
  profiles: { full_name: string | null } | null
}

interface Props {
  firstName: string
  totalOwned: number
  totalStickers: number
  totalDupes: number
  matchCount: number
  recentOwned: Sticker[]
  matchingTrades: MatchingTrade[]
}

const MILESTONES = [25, 50, 75, 100]

export default function InicioContent({
  firstName, totalOwned, totalStickers, totalDupes, matchCount, recentOwned, matchingTrades,
}: Props) {
  const progressPct = totalStickers ? (totalOwned / totalStickers) * 100 : 0
  const missing     = totalStickers - totalOwned

  const stats = [
    { icon: BookOpen,  color: "gold",    num: totalOwned,  lbl: "Coladas",   sub: "no álbum" },
    { icon: Repeat2,   color: "success", num: totalDupes,  lbl: "Repetidas", sub: "prontas para trocar" },
    { icon: RefreshCw, color: "pink",    num: matchCount,  lbl: "Matches",   sub: "trocas que combinam" },
    { icon: Flame,     color: "violet",  num: 0,           lbl: "Sequência", sub: "dias colando" },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 6 }}>
          Olá, {firstName.toLowerCase()}
        </div>
        <h1 style={{ fontFamily: "var(--font-bebas)", fontSize: 56, letterSpacing: "0.02em", lineHeight: 0.95, margin: 0, color: "var(--ink-0)" }}>
          Faltam <span style={{ color: "var(--gold)" }}>{missing}</span> figurinhas
        </h1>
        <p style={{ color: "var(--ink-2)", marginTop: 8, fontSize: 14 }}>
          Você está a {Math.round(100 - progressPct)}% de completar o álbum. Bora?
        </p>
      </div>

      {/* Progress hero */}
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
            <div key={m} className={`milestone${progressPct >= m ? " hit" : ""}`} style={{ left: `${m}%` }}>
              <div className="dot" />{m}%
            </div>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        {stats.map(({ icon: Icon, color, num, lbl, sub }) => (
          <div key={lbl} className="stat-card">
            <div className={`stat-icon ${color}`}>
              <Icon size={18} />
            </div>
            <div className="stat-num">{num}</div>
            <div className="stat-lbl">{lbl}</div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      {/* Home grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
          marginTop: 4,
        }}
        className="home-grid-responsive"
      >
        {/* Recent stickers */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--line)",
            borderRadius: 18,
            padding: 20,
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ fontFamily: "var(--font-bebas)", fontSize: 22, letterSpacing: "0.04em", margin: 0, color: "var(--ink-0)" }}>
              Coladas recentemente
            </h3>
            <Link href="/colecao" style={{ fontSize: 12, color: "var(--gold)", fontWeight: 600 }}>
              Ver tudo →
            </Link>
          </div>

          {recentOwned.length === 0 ? (
            <div className="ds-empty" style={{ padding: 30 }}>
              <div>Nenhuma figurinha colada ainda</div>
            </div>
          ) : (
            <div className="stickers-grid">
              {recentOwned.map((s) => {
                const countryInfo = ALL_COUNTRIES.find((c) => c.code === s.countryCode)
                return (
                  <div
                    key={s.id}
                    className="sticker-card collected"
                    style={{ "--country-bg": countryGradient(s.countryCode) } as React.CSSProperties}
                  >
                    <div>
                      <div className="sticker-num">{s.number}</div>
                      <div className="sticker-code">{s.countryCode}</div>
                    </div>
                    <div className="sticker-country">
                      {countryInfo?.iso
                        ? <CountryFlag iso={countryInfo.iso} name={s.country} size={16} />
                        : countryInfo?.flag && <span className="sticker-flag">{countryInfo.flag}</span>
                      }
                      <span>{s.countryCode}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Matching trades */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--line)",
            borderRadius: 18,
            padding: 20,
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ fontFamily: "var(--font-bebas)", fontSize: 22, letterSpacing: "0.04em", margin: 0, color: "var(--ink-0)" }}>
              Trocas que combinam
            </h3>
            <Link href="/trocas" style={{ fontSize: 12, color: "var(--gold)", fontWeight: 600 }}>
              Ver mural →
            </Link>
          </div>

          {matchingTrades.length === 0 ? (
            <div className="ds-empty" style={{ padding: 20 }}>
              <div style={{ fontSize: 13 }}>Nenhum match no momento</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {matchingTrades.map((t) => {
                const wantSticker  = ALL_STICKERS.find((s) => s.id === t.wanting_sticker_id)
                const offerSticker = ALL_STICKERS.find((s) => s.id === t.offering_sticker_id)
                return (
                  <div key={t.id} className="sug-trade">
                    <div
                      className="sug-mini"
                      style={{ "--country-bg": wantSticker ? countryGradient(wantSticker.countryCode) : undefined } as React.CSSProperties}
                    >
                      {wantSticker?.number ?? "?"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-0)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {t.profiles?.full_name ?? "Usuário"} oferece {offerSticker?.code ?? t.offering_sticker_id}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                        quer {wantSticker?.code ?? t.wanting_sticker_id} — você tem!
                      </div>
                    </div>
                    <Link href="/trocas" className="btn-trade">Trocar</Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
