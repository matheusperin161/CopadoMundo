"use client"

import { useEffect, useState } from "react"
import { ChevronUp } from "lucide-react"

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Voltar ao topo"
      className="fixed z-40 bottom-24 right-4 md:bottom-6 md:right-6 flex items-center justify-center size-11 rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
      style={{
        background: "var(--gold)",
        color: "#1a1300",
        boxShadow: "0 4px 20px rgba(255,210,63,0.35)",
      }}
    >
      <ChevronUp size={20} strokeWidth={2.5} />
    </button>
  )
}
