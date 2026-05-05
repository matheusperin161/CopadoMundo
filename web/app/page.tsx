import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect("/colecao")

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#0A1628]">
      {/* Diagonal stripes */}
      <div className="absolute inset-0 overflow-hidden opacity-[0.03]">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-px bg-[#FFD700]"
            style={{ width: "200%", top: `${i * 5}%`, left: "-50%", transform: "rotate(-15deg)" }}
          />
        ))}
      </div>

      {/* Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FFD700]/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#CC0000]/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-10 px-6 text-center max-w-2xl w-full">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#FFD700]/30 bg-[#FFD700]/10">
          <span className="text-[#FFD700] text-xs font-semibold tracking-widest uppercase">Panini Official</span>
        </div>

        {/* Hero */}
        <div className="flex flex-col gap-1">
          <h1 className="text-7xl md:text-9xl font-black text-white tracking-wider leading-none" style={{ fontFamily: "var(--font-bebas)" }}>
            Copa
          </h1>
          <h1 className="text-7xl md:text-9xl font-black leading-none" style={{ fontFamily: "var(--font-bebas)", color: "#FFD700" }}>
            2026
          </h1>
          <p className="text-white/50 text-base md:text-lg mt-2">Seu álbum de figurinhas digital</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {[
            { icon: "📋", title: "Minha Coleção", desc: "Marque figurinhas coletadas e veja o que ainda falta" },
            { icon: "🔄", title: "Repetidas", desc: "Controle as repetidas com a quantidade exata" },
            { icon: "🤝", title: "Trocas", desc: "Poste e encontre trocas com outros colecionadores" },
          ].map((f) => (
            <div key={f.title} className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
              <span className="text-3xl">{f.icon}</span>
              <span className="text-white font-semibold text-sm">{f.title}</span>
              <span className="text-white/40 text-xs leading-relaxed">{f.desc}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/login"
          className="flex items-center justify-center py-4 px-10 rounded-2xl font-bold text-[#0A1628] text-base transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)" }}
        >
          Começar agora
        </Link>

        {/* Stats */}
        <div className="flex items-center gap-8 pt-4 border-t border-white/10 w-full justify-center flex-wrap">
          {[["985", "figurinhas"], ["48", "seleções"], ["12", "grupos"], ["3", "países-sede"]].map(([num, label]) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-black text-[#FFD700]" style={{ fontFamily: "var(--font-bebas)" }}>{num}</span>
              <span className="text-white/40 text-xs">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
