import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser, getUserCollection } from "@/lib/supabase/queries"
import { ALL_STICKERS, ALL_COUNTRIES, countryGradient } from "@/lib/data/stickers"
import CountryFlag from "@/components/country-flag"
import Link from "next/link"
import { ArrowLeft, Star } from "lucide-react"

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

export default async function UserTradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const currentUser = await getCurrentUser()
  if (!currentUser) redirect("/login")

  const supabase = await createClient()
  const [profileRes, dupesRes, myCollection] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url").eq("id", id).single(),
    supabase.from("user_duplicates").select("sticker_id, quantity").eq("user_id", id).gt("quantity", 0),
    getUserCollection(currentUser.id),
  ])

  const targetName = profileRes.data?.full_name ?? "Usuário"
  const myOwnedSet = new Set(myCollection.map((r) => r.sticker_id))

  // target's dupes that I don't own
  const useful = (dupesRes.data ?? []).filter((d) => !myOwnedSet.has(d.sticker_id))

  // Group by country
  type CountryGroup = { label: string; flag: string; iso?: string; items: { sticker: typeof ALL_STICKERS[0]; qty: number }[] }
  const byCountry = new Map<string, CountryGroup>()
  for (const d of useful) {
    const sticker = ALL_STICKERS.find((s) => s.id === d.sticker_id)
    if (!sticker) continue
    if (!byCountry.has(sticker.countryCode)) {
      const info = ALL_COUNTRIES.find((c) => c.code === sticker.countryCode)
      byCountry.set(sticker.countryCode, { label: sticker.country, flag: info?.flag ?? "🏆", iso: info?.iso, items: [] })
    }
    byCountry.get(sticker.countryCode)!.items.push({ sticker, qty: d.quantity })
  }

  const initials = targetName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
  const firstName = targetName.split(" ")[0]

  return (
    <div className="flex flex-col gap-6">
      {/* back */}
      <Link
        href="/trocas"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-3)", width: "fit-content" }}
      >
        <ArrowLeft size={14} /> Voltar às trocas
      </Link>

      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, flexShrink: 0,
          display: "grid", placeItems: "center",
          fontFamily: "var(--font-bebas)", fontWeight: 700, fontSize: 24, color: "white",
          background: avatarGradient(id),
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 4 }}>
            Repetidas disponíveis
          </div>
          <h1 style={{ fontFamily: "var(--font-bebas)", fontSize: 40, letterSpacing: "0.02em", lineHeight: 0.95, margin: 0, color: "var(--ink-0)" }}>
            <span style={{ color: "var(--gold)" }}>{firstName}</span> tem o que você precisa
          </h1>
        </div>
      </div>

      {/* summary */}
      <div
        className="progress-hero"
        style={{ padding: "18px 24px" }}
      >
        {useful.length === 0 ? (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
            <div style={{ fontSize: 14, color: "var(--ink-2)" }}>
              Você já tem tudo que {firstName} tem de repetida!
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 48, fontFamily: "var(--font-bebas)", color: "var(--gold)", lineHeight: 1 }}>
              {useful.length}
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)" }}>figurinha{useful.length !== 1 ? "s" : ""}</div>
              <div style={{ fontSize: 14, color: "var(--ink-1)", marginTop: 2 }}>que {firstName} tem repetida e você não tem</div>
            </div>
          </div>
        )}
      </div>

      {/* groups */}
      {Array.from(byCountry.entries()).map(([code, { label, flag, iso, items }]) => (
        <div key={code} className="group-section">
          <div className="group-head">
            <div className="group-icon">
              {iso ? <CountryFlag iso={iso} name={label} size={28} /> : <span style={{ fontSize: 20 }}>{flag}</span>}
            </div>
            <div>
              <div className="group-title">{label}</div>
              <div className="group-meta">{items.length} figurinha{items.length !== 1 ? "s" : ""}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "0 4px" }}>
            {items.map(({ sticker, qty }) => (
              <div
                key={sticker.id}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 12px", borderRadius: 12,
                  background: "var(--bg-1)",
                  border: "1px solid var(--line)",
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-bebas)", fontSize: 14, color: "white",
                  background: countryGradient(sticker.countryCode),
                }}>
                  {sticker.number}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-0)", lineHeight: 1.2 }}>
                    {sticker.code}
                  </div>
                  {sticker.playerName && sticker.group !== "CC" && (
                    <div style={{ fontSize: 11, color: "var(--ink-3)", lineHeight: 1.2 }}>
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
  )
}
