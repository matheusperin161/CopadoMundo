"use client"

import { useEffect, useState, useMemo } from "react"
import { createPortal } from "react-dom"
import { X, Loader2, Star } from "lucide-react"
import { ALL_STICKERS, ALL_COUNTRIES, countryGradient } from "@/lib/data/stickers"
import { createClient } from "@/lib/supabase/client"
import CountryFlag from "@/components/country-flag"

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #A78BFA, #F472B6)",
  "linear-gradient(135deg, #38BDF8, #34D399)",
  "linear-gradient(135deg, #FFD23F, #FF6B6B)",
  "linear-gradient(135deg, #F472B6, #38BDF8)",
  "linear-gradient(135deg, #34D399, #A78BFA)",
]
function avatarGradient(id: string) {
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return AVATAR_GRADIENTS[n % AVATAR_GRADIENTS.length]
}

interface DupeRow { sticker_id: string; quantity: number }

interface Props {
  targetUserId: string
  targetName: string
  currentOwnedSet: Set<string>
  onClose: () => void
}

export default function UserProfileSheet({ targetUserId, targetName, currentOwnedSet, onClose }: Props) {
  const [dupes, setDupes]   = useState<DupeRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from("user_duplicates")
      .select("sticker_id, quantity")
      .eq("user_id", targetUserId)
      .gt("quantity", 0)
      .then(({ data }) => { setDupes(data ?? []); setLoading(false) })
  }, [targetUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Only show stickers the target has duplicates of AND the current user doesn't own
  const useful = useMemo(() => {
    if (!dupes) return []
    return dupes.filter((d) => !currentOwnedSet.has(d.sticker_id))
  }, [dupes, currentOwnedSet])

  // Group useful stickers by country
  const byCountry = useMemo(() => {
    const map = new Map<string, { label: string; flag: string; iso?: string; items: { sticker: typeof ALL_STICKERS[0]; qty: number }[] }>()
    for (const d of useful) {
      const sticker = ALL_STICKERS.find((s) => s.id === d.sticker_id)
      if (!sticker) continue
      if (!map.has(sticker.countryCode)) {
        const info = ALL_COUNTRIES.find((c) => c.code === sticker.countryCode)
        map.set(sticker.countryCode, { label: sticker.country, flag: info?.flag ?? "🏆", iso: info?.iso, items: [] })
      }
      map.get(sticker.countryCode)!.items.push({ sticker, qty: d.quantity })
    }
    return map
  }, [useful])

  const initials = targetName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-end"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full flex flex-col"
        style={{
          background: "var(--bg-card, #111827)",
          borderRadius: "24px 24px 0 0",
          borderTop: "1px solid var(--line-2, rgba(255,255,255,0.1))",
          maxHeight: "85dvh",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* drag handle */}
        <div style={{ padding: "12px 0 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.18)" }} />
        </div>

        {/* header */}
        <div style={{ padding: "16px 20px 14px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid var(--line, rgba(255,255,255,0.07))" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            display: "grid", placeItems: "center",
            fontWeight: 700, fontSize: 18, color: "white",
            background: avatarGradient(targetUserId),
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink-0, #fff)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {targetName}
            </div>
            {!loading && (
              <div style={{ fontSize: 12, color: "var(--ink-3, rgba(255,255,255,0.4))", marginTop: 2 }}>
                {useful.length === 0
                  ? "Nenhuma repetida que você precisa"
                  : `${useful.length} figurinha${useful.length !== 1 ? "s" : ""} que você não tem`}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(255,255,255,0.07)", border: "none", cursor: "pointer", flexShrink: 0 }}
          >
            <X size={16} color="rgba(255,255,255,0.6)" />
          </button>
        </div>

        {/* section label */}
        <div style={{ padding: "14px 20px 4px", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-3, rgba(255,255,255,0.35))" }}>
          Repetidas que você não tem
        </div>

        {/* scrollable content */}
        <div style={{ overflowY: "auto", flex: 1, padding: "0 20px 32px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 10, color: "var(--ink-3, rgba(255,255,255,0.4))" }}>
              <Loader2 size={18} className="animate-spin" />
              <span style={{ fontSize: 14 }}>Carregando…</span>
            </div>
          ) : useful.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>✨</div>
              <div style={{ fontSize: 14, color: "var(--ink-2, rgba(255,255,255,0.5))" }}>
                Você já tem tudo que {targetName.split(" ")[0]} tem de repetida!
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 12 }}>
              {Array.from(byCountry.entries()).map(([code, { label, flag, iso, items }]) => (
                <div key={code}>
                  {/* country heading */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, overflow: "hidden", flexShrink: 0, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.06)" }}>
                      {iso ? <CountryFlag iso={iso} name={label} size={28} /> : <span style={{ fontSize: 16 }}>{flag}</span>}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "var(--ink-0, #fff)" }}>{label}</span>
                    <span style={{ fontSize: 11, color: "var(--ink-3, rgba(255,255,255,0.35))", marginLeft: 2 }}>
                      {items.length} figurinha{items.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* sticker chips */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {items.map(({ sticker, qty }) => (
                      <div
                        key={sticker.id}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "8px 12px", borderRadius: 12,
                          background: "var(--bg-1, rgba(255,255,255,0.05))",
                          border: "1px solid var(--line, rgba(255,255,255,0.08))",
                        }}
                      >
                        {/* mini sticker card */}
                        <div style={{
                          width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "var(--font-bebas, sans-serif)", fontSize: 14, color: "white",
                          background: countryGradient(sticker.countryCode),
                        }}>
                          {sticker.number}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-0, #fff)", lineHeight: 1.2 }}>
                            {sticker.code}
                          </div>
                          {sticker.playerName && (
                            <div style={{ fontSize: 11, color: "var(--ink-3, rgba(255,255,255,0.4))", lineHeight: 1.2 }}>
                              {sticker.playerName}
                            </div>
                          )}
                        </div>
                        {qty > 1 && (
                          <div style={{
                            display: "flex", alignItems: "center", gap: 3,
                            padding: "2px 7px", borderRadius: 20,
                            background: "rgba(255,210,63,0.12)", border: "1px solid rgba(255,210,63,0.3)",
                          }}>
                            <Star size={10} color="#FFD23F" fill="#FFD23F" />
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#FFD23F" }}>×{qty}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
