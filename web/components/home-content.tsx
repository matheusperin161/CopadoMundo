"use client"

import Image from "next/image"
import Link from "next/link"
import { BookOpen, Repeat2, ArrowLeftRight, ChevronRight } from "lucide-react"

const features = [
  {
    icon: BookOpen,
    title: "Minha Coleção",
    desc: "Marque as figurinhas coletadas e acompanhe seu progresso",
    color: "#FFD700",
    bg: "rgba(255,215,0,0.07)",
    border: "rgba(255,215,0,0.18)",
  },
  {
    icon: Repeat2,
    title: "Repetidas",
    desc: "Controle as repetidas com a quantidade exata",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.07)",
    border: "rgba(96,165,250,0.18)",
  },
  {
    icon: ArrowLeftRight,
    title: "Trocas",
    desc: "Publique suas repetidas e encontre quem tem o que você precisa",
    color: "#34d399",
    bg: "rgba(52,211,153,0.07)",
    border: "rgba(52,211,153,0.18)",
  },
]

const stats = [
  { num: "985", label: "figurinhas" },
  { num: "48", label: "seleções" },
  { num: "3", label: "países-sede" },
]

export default function HomeContent() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#0A1628]">
      {/* Background glows */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#FFD700]/8 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,215,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-7 px-5 py-10 text-center max-w-sm w-full mx-auto">

        {/* Logo + badge */}
        <div className="animate-fade-up delay-0 flex flex-col items-center gap-3">
          <div className="animate-float">
            <Image
              src="/logo_sem_fundo.png"
              alt="Copa 2026"
              width={88}
              height={88}
              className="object-contain drop-shadow-[0_0_24px_rgba(255,215,0,0.35)]"
            />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#FFD700]/25 bg-[#FFD700]/8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-pulse" />
            <span className="text-[#FFD700] text-[10px] font-bold tracking-[0.2em] uppercase">Panini Official</span>
          </div>
        </div>

        {/* Hero title */}
        <div className="animate-fade-up delay-75 flex flex-col items-center gap-0">
          <h1
            className="text-[88px] font-black text-white leading-[0.9] tracking-wide"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Copa
          </h1>
          <h1
            className="text-[88px] font-black leading-[0.9] tracking-wide"
            style={{
              fontFamily: "var(--font-bebas)",
              color: "#FFD700",
              textShadow: "0 0 60px rgba(255,215,0,0.35)",
            }}
          >
            2026
          </h1>
          <p className="text-white/45 text-sm mt-3 tracking-wide">Seu álbum de figurinhas digital</p>
        </div>

        {/* Feature cards */}
        <div className="animate-fade-up delay-150 w-full flex flex-col gap-2.5">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl text-left transition-all duration-200 active:scale-[0.98]"
                style={{ background: f.bg, border: `1px solid ${f.border}` }}
              >
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                  style={{ background: `${f.color}12`, border: `1px solid ${f.color}25` }}
                >
                  <Icon size={18} style={{ color: f.color }} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-white font-semibold text-sm leading-none mb-1">{f.title}</p>
                  <p className="text-white/35 text-xs leading-relaxed">{f.desc}</p>
                </div>
                <ChevronRight size={14} className="text-white/15 shrink-0" />
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="animate-fade-up delay-225 w-full">
          <Link
            href="/login"
            className="animate-glow flex items-center justify-center w-full py-4 rounded-2xl font-bold text-[#0A1628] text-[15px] tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)" }}
          >
            Começar agora
          </Link>
          <p className="text-white/25 text-[10px] mt-2.5 tracking-wide">Gratuito · Sem anúncios · Login com Google</p>
        </div>

        {/* Stats */}
        <div className="animate-fade-up delay-300 flex items-center gap-0 pt-4 border-t border-white/8 w-full justify-center">
          {stats.map((s, i) => (
            <div key={s.label} className="flex items-center">
              <div className="flex flex-col items-center gap-0.5 px-5">
                <span
                  className="text-2xl font-black text-[#FFD700]"
                  style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.05em" }}
                >
                  {s.num}
                </span>
                <span className="text-white/30 text-[10px] uppercase tracking-widest">{s.label}</span>
              </div>
              {i < stats.length - 1 && <div className="w-px h-7 bg-white/10" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
