"use client"

import { useRef, useState } from "react"
import { Camera, X, Check, AlertCircle, Loader2, ScanLine, Edit2 } from "lucide-react"
import { ALL_STICKERS, getStickerById } from "@/lib/data/stickers"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

type Phase = "idle" | "scanning" | "confirm" | "saving"

interface Match {
  stickerId: string
  isOwned: boolean
}

interface Props {
  userId: string
  owned: Set<string>
  onCollectionAdd: (stickerId: string) => void
  onDuplicateAdd: (stickerId: string) => void
}

// Canvas pre-processing: grayscale + contrast boost for better OCR
function preprocessToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, 1200 / Math.max(img.width, img.height))
      const canvas = document.createElement("canvas")
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = imageData.data
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        const boosted = Math.min(255, Math.max(0, (gray - 128) * 2 + 128))
        d[i] = d[i + 1] = d[i + 2] = boosted
      }
      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL("image/png"))
    }
    img.src = URL.createObjectURL(file)
  })
}

const VALID_CODES = new Set(ALL_STICKERS.map((s) => s.countryCode))

function parseOcrText(text: string): Match | null {
  const upper = text.toUpperCase().replace(/[^A-Z0-9]/g, " ").replace(/\s+/g, " ").trim()

  // Try CODE+NUM patterns: "BRA 5", "BRA5", "FWC 12", "CC 3"
  const patterns = [
    /\b([A-Z]{2,3})\s*(\d{1,3})\b/g,
    /\b(\d{1,3})\s*([A-Z]{2,3})\b/g,
  ]

  for (const pattern of patterns) {
    let match
    pattern.lastIndex = 0
    while ((match = pattern.exec(upper)) !== null) {
      const [, a, b] = match
      const isACode = isNaN(Number(a))
      const code = isACode ? a : b
      const numStr = isACode ? b : a
      const num = parseInt(numStr, 10)
      if (!VALID_CODES.has(code) || isNaN(num) || num < 1) continue
      const stickerId = `${code}${num}`
      const sticker = getStickerById(stickerId)
      if (sticker) return { stickerId, isOwned: false }
    }
  }
  return null
}

export default function StickerScanner({ userId, owned, onCollectionAdd, onDuplicateAdd }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>("idle")
  const [match, setMatch] = useState<Match | null>(null)
  const [manualCode, setManualCode] = useState("")
  const [showManual, setShowManual] = useState(false)
  const supabase = createClient()

  async function handleFile(file: File) {
    setPhase("scanning")
    setMatch(null)
    setShowManual(false)

    try {
      const dataUrl = await preprocessToDataUrl(file)
      const { createWorker } = await import("tesseract.js")
      const worker = await createWorker("eng")
      const { data: { text } } = await worker.recognize(dataUrl)
      await worker.terminate()

      const result = parseOcrText(text)
      if (result) {
        setMatch({ ...result, isOwned: owned.has(result.stickerId) })
        setPhase("confirm")
      } else {
        setPhase("idle")
        setShowManual(true)
        toast.error("Não foi possível ler a figurinha. Tente o modo manual.")
      }
    } catch {
      setPhase("idle")
      setShowManual(true)
      toast.error("Erro no scanner. Use o modo manual.")
    }
  }

  function handleManual() {
    const upper = manualCode.toUpperCase().trim().replace(/\s+/g, "")
    const directMatch = getStickerById(upper)
    if (directMatch) {
      setMatch({ stickerId: upper, isOwned: owned.has(upper) })
      setPhase("confirm")
      setShowManual(false)
      return
    }
    // Try parsing as "BRA5" or "BRA 5"
    const parsed = parseOcrText(upper)
    if (parsed) {
      setMatch({ ...parsed, isOwned: owned.has(parsed.stickerId) })
      setPhase("confirm")
      setShowManual(false)
    } else {
      toast.error("Código não encontrado. Exemplo: BRA5, FWC12, CC3")
    }
  }

  async function confirm() {
    if (!match) return
    setPhase("saving")
    const { stickerId, isOwned } = match

    if (!isOwned) {
      const { error } = await supabase.from("user_collection")
        .upsert({ user_id: userId, sticker_id: stickerId })
      if (error) {
        toast.error("Erro ao salvar na coleção")
        setPhase("confirm")
        return
      }
      onCollectionAdd(stickerId)
      toast.success("Figurinha colada na coleção!")
    } else {
      const { data: existing } = await supabase.from("user_duplicates")
        .select("quantity").eq("user_id", userId).eq("sticker_id", stickerId).single()
      const nextQty = (existing?.quantity ?? 0) + 1
      const { error } = await supabase.from("user_duplicates")
        .upsert(
          { user_id: userId, sticker_id: stickerId, quantity: nextQty },
          { onConflict: "user_id,sticker_id" }
        )
      if (error) {
        toast.error("Erro ao salvar nas repetidas")
        setPhase("confirm")
        return
      }
      onDuplicateAdd(stickerId)
      toast.success("Adicionada às repetidas!")
    }

    setPhase("idle")
    setMatch(null)
    setManualCode("")
  }

  function cancel() {
    setPhase("idle")
    setMatch(null)
    setManualCode("")
    setShowManual(false)
  }

  const sticker = match ? getStickerById(match.stickerId) : null

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={phase === "scanning" || phase === "saving"}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
        style={{ background: "var(--gold)", color: "#1a1300" }}
        title="Escanear figurinha"
      >
        {phase === "scanning" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <ScanLine size={16} />
        )}
        {phase === "scanning" ? "Lendo..." : "Escanear"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ""
        }}
      />

      {/* Manual input fallback */}
      {showManual && phase === "idle" && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: "var(--bg-1)", border: "1px solid var(--line)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2" style={{ color: "var(--ink-0)" }}>
                <Edit2 size={18} style={{ color: "var(--gold)" }} />
                <span className="font-semibold">Código manual</span>
              </div>
              <button onClick={cancel} style={{ color: "var(--ink-3)" }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-2)" }}>
              Digite o código da figurinha. Ex: <strong>BRA5</strong>, <strong>FWC12</strong>, <strong>CC3</strong>
            </p>
            <input
              autoFocus
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManual()}
              placeholder="ex: BRA5"
              className="px-4 py-3 rounded-xl text-base font-mono uppercase"
              style={{
                background: "var(--bg-0)",
                border: "1px solid var(--line)",
                color: "var(--ink-0)",
                outline: "none",
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={cancel}
                className="flex-1 py-3 rounded-xl font-semibold text-sm"
                style={{ background: "var(--bg-0)", color: "var(--ink-2)", border: "1px solid var(--line)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleManual}
                className="flex-1 py-3 rounded-xl font-semibold text-sm"
                style={{ background: "var(--gold)", color: "#1a1300" }}
              >
                Buscar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {(phase === "confirm" || phase === "saving") && sticker && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
            style={{ background: "var(--bg-1)", border: "1px solid var(--line)" }}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold" style={{ color: "var(--ink-0)" }}>Figurinha encontrada</span>
              <button onClick={cancel} style={{ color: "var(--ink-3)" }}>
                <X size={20} />
              </button>
            </div>

            {/* Sticker preview */}
            <div
              className="rounded-xl p-4 flex items-center gap-4"
              style={{ background: "var(--bg-0)", border: "1px solid var(--line)" }}
            >
              <div
                className="rounded-xl flex flex-col items-center justify-center size-16 font-bold text-white text-xs gap-0.5"
                style={{ background: "linear-gradient(135deg, var(--gold), #ff9f00)", color: "#1a1300" }}
              >
                <span style={{ fontSize: 20, fontWeight: 800 }}>{sticker.number}</span>
                <span style={{ fontSize: 10, letterSpacing: "0.1em" }}>{sticker.countryCode}</span>
              </div>
              <div>
                <p style={{ fontWeight: 700, color: "var(--ink-0)" }}>{sticker.country}</p>
                {sticker.playerName && (
                  <p style={{ fontSize: 13, color: "var(--ink-2)" }}>{sticker.playerName}</p>
                )}
                <div className="flex items-center gap-1.5 mt-2">
                  {match!.isOwned ? (
                    <>
                      <AlertCircle size={14} style={{ color: "#f59e0b" }} />
                      <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>Já está na coleção → vai para repetidas</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} style={{ color: "#34d399" }} />
                      <span style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>Nova figurinha → vai para a coleção</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancel}
                className="flex-1 py-3 rounded-xl font-semibold text-sm"
                style={{ background: "var(--bg-0)", color: "var(--ink-2)", border: "1px solid var(--line)" }}
              >
                Cancelar
              </button>
              <button
                onClick={confirm}
                disabled={phase === "saving"}
                className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                style={{ background: "var(--gold)", color: "#1a1300" }}
              >
                {phase === "saving" ? (
                  <><Loader2 size={15} className="animate-spin" /> Salvando...</>
                ) : match!.isOwned ? (
                  "Adicionar às repetidas"
                ) : (
                  "Colar na coleção"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
