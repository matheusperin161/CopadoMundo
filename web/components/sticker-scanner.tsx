"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { X, Zap, ZapOff, RotateCcw, Loader2, Check, AlertCircle, Keyboard } from "lucide-react"
import type { Worker as TesseractWorker } from "tesseract.js"
import { getStickerById, ALL_STICKERS } from "@/lib/data/stickers"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const VALID_CODES = new Set(ALL_STICKERS.map((s) => s.countryCode))

function parseStickerCode(text: string): string | null {
  const upper = text.toUpperCase().replace(/[^A-Z0-9]/g, " ").replace(/\s+/g, " ").trim()
  const patterns = [/\b([A-Z]{2,3})\s*(\d{1,3})\b/g, /\b(\d{1,3})\s*([A-Z]{2,3})\b/g]
  for (const pattern of patterns) {
    let match
    pattern.lastIndex = 0
    while ((match = pattern.exec(upper)) !== null) {
      const [, a, b] = match
      const isACode = isNaN(Number(a))
      const code = isACode ? a : b
      const num = parseInt(isACode ? b : a, 10)
      // Only validate the country code — sticker number range is checked when saving
      if (VALID_CODES.has(code) && !isNaN(num) && num >= 1 && num <= 99) {
        return `${code}${num}`
      }
    }
  }
  return null
}

interface Detection { stickerId: string; isOwned: boolean }

interface Props {
  userId: string
  owned: Set<string>
  onClose: () => void
  onCollectionAdd: (stickerId: string) => void
  onDuplicateAdd: (stickerId: string) => void
}

const hasTextDetector = typeof window !== "undefined" && "TextDetector" in window

export default function StickerScannerModal({ userId, owned, onClose, onCollectionAdd, onDuplicateAdd }: Props) {
  const videoRef      = useRef<HTMLVideoElement>(null)
  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const workerRef     = useRef<TesseractWorker | null>(null)
  const detectorRef   = useRef<{ detect: (src: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } | null>(null)
  const streamRef     = useRef<MediaStream | null>(null)
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const busyRef       = useRef(false)
  const fileInputRef  = useRef<HTMLInputElement>(null)

  const [ready,       setReady]       = useState(false)
  const [analyzing,   setAnalyzing]   = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const [torchOn,     setTorchOn]     = useState(false)
  const [facing,      setFacing]      = useState<"user" | "environment">("environment")
  const [detection,   setDetection]   = useState<Detection | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [manualInput, setManualInput] = useState(false)
  const [manualCode,  setManualCode]  = useState("")
  const supabase = createClient()

  /* ── camera ──────────────────────────────────────────── */
  const stopStream = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async (mode: "user" | "environment") => {
    stopStream()
    let s: MediaStream
    try {
      s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: mode } } })
    } catch {
      s = await navigator.mediaDevices.getUserMedia({ video: true })
    }
    streamRef.current = s
    if (videoRef.current) {
      videoRef.current.srcObject = s
      await videoRef.current.play().catch(() => {})
    }
  }, [stopStream])

  /* ── OCR: TextDetector (Chrome Android) or Tesseract ── */
  const scanFrame = useCallback(async () => {
    if (busyRef.current || !videoRef.current) return
    const video = videoRef.current
    if (video.readyState < 2 || video.videoWidth === 0) return
    busyRef.current = true
    setAnalyzing(true)
    try {
      let stickerId: string | null = null

      // Primary: TextDetector API — native, instant, accurate (Chrome Android)
      if (detectorRef.current) {
        const blocks = await detectorRef.current.detect(video)
        for (const block of blocks) {
          stickerId = parseStickerCode(block.rawValue)
          if (stickerId) break
        }
      } else if (workerRef.current && canvasRef.current) {
        // Fallback: Tesseract.js with restricted character set
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")!
        const scale = Math.min(1, 900 / Math.max(video.videoWidth, video.videoHeight))
        canvas.width  = Math.round(video.videoWidth  * scale)
        canvas.height = Math.round(video.videoHeight * scale)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        // Grayscale only — aggressive contrast destroys text
        const id = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const d = id.data
        for (let i = 0; i < d.length; i += 4) {
          const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
          d[i] = d[i + 1] = d[i + 2] = g
        }
        ctx.putImageData(id, 0, 0)
        const { data: { text } } = await workerRef.current.recognize(canvas)
        stickerId = parseStickerCode(text)
      }

      if (stickerId) {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        setDetection({ stickerId, isOwned: owned.has(stickerId) })
      }
    } finally {
      busyRef.current = false
      setAnalyzing(false)
    }
  }, [owned])

  const startScanning = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    // TextDetector is instant — scan every 600ms; Tesseract is slow — 2s
    const interval = hasTextDetector ? 600 : 2000
    timerRef.current = setInterval(scanFrame, interval)
  }, [scanFrame])

  /* ── init ─────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false
    async function init() {
      await startCamera("environment")
      if (cancelled) return

      if (hasTextDetector) {
        // Native text recognition — no extra library needed
        detectorRef.current = new (window as unknown as { TextDetector: new () => typeof detectorRef.current }). TextDetector()
        setReady(true)
      } else {
        // Tesseract.js fallback with character whitelist for accuracy
        const { createWorker } = await import("tesseract.js")
        const worker = await createWorker("eng")
        if (cancelled) { worker.terminate(); return }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (worker as any).setParameters({
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ",
          tessedit_pageseg_mode: "11",
        })
        workerRef.current = worker
        setReady(true)
      }

      startScanning()
    }
    init().catch(() => setCameraError(true))
    return () => {
      cancelled = true
      stopStream()
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── torch ────────────────────────────────────────────── */
  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    const next = !torchOn
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] })
      setTorchOn(next)
    } catch { toast.error("Flash não disponível") }
  }

  /* ── flip camera ──────────────────────────────────────── */
  async function flipCamera() {
    const next = facing === "environment" ? "user" : "environment"
    setFacing(next)
    await startCamera(next)
    if (ready) startScanning()
  }

  /* ── manual input ─────────────────────────────────────── */
  function submitManual() {
    const upper = manualCode.toUpperCase().replace(/\s+/g, "")
    const id = parseStickerCode(upper) ?? parseStickerCode(upper.replace(/(\D+)(\d+)/, "$1 $2"))
    if (id) {
      setDetection({ stickerId: id, isOwned: owned.has(id) })
      setManualInput(false)
      setManualCode("")
    } else {
      toast.error("Código inválido. Ex: QAT12, BRA 5, FWC3")
    }
  }

  /* ── file fallback ────────────────────────────────────── */
  async function handleFallbackFile(file: File) {
    const { createWorker } = await import("tesseract.js")
    const worker = await createWorker("eng")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (worker as any).setParameters({
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ",
    })
    const url = URL.createObjectURL(file)
    const { data: { text } } = await worker.recognize(url)
    await worker.terminate()
    URL.revokeObjectURL(url)
    const id = parseStickerCode(text)
    if (id) {
      setDetection({ stickerId: id, isOwned: owned.has(id) })
      setCameraError(false)
    } else {
      toast.error("Não foi possível ler. Use o teclado.")
      setManualInput(true)
    }
  }

  /* ── dismiss & resume ─────────────────────────────────── */
  function dismiss() {
    setDetection(null)
    startScanning()
  }

  /* ── confirm ──────────────────────────────────────────── */
  async function confirm() {
    if (!detection) return
    setSaving(true)
    const { stickerId, isOwned } = detection

    if (!isOwned) {
      const { error } = await supabase.from("user_collection")
        .upsert({ user_id: userId, sticker_id: stickerId })
      if (error) { toast.error("Erro ao salvar"); setSaving(false); return }
      onCollectionAdd(stickerId)
      toast.success("Figurinha colada na coleção!")
    } else {
      const { data: existing } = await supabase.from("user_duplicates")
        .select("quantity").eq("user_id", userId).eq("sticker_id", stickerId).single()
      const nextQty = (existing?.quantity ?? 0) + 1
      const { error } = await supabase.from("user_duplicates")
        .upsert({ user_id: userId, sticker_id: stickerId, quantity: nextQty }, { onConflict: "user_id,sticker_id" })
      if (error) { toast.error("Erro ao salvar"); setSaving(false); return }
      onDuplicateAdd(stickerId)
      toast.success("Adicionada às repetidas!")
    }
    setSaving(false)
    dismiss()
  }

  const sticker      = detection ? getStickerById(detection.stickerId) : null
  const detected     = detection !== null
  const borderColor  = detected ? "#4ade80" : "#FFD23F"

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black overflow-hidden">
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFallbackFile(f); e.target.value = "" }} />

      {/* Dark overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(0,0,0,0.45)" }} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-12 pb-4">
        <button onClick={onClose} className="size-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.55)" }}>
          <X size={20} color="white" />
        </button>
        <span className="text-white font-semibold text-base">Scanner de Figurinhas</span>
        <button onClick={() => setManualInput(true)} className="size-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.55)" }} title="Digitar código">
          <Keyboard size={18} color="white" />
        </button>
      </div>

      {/* Scan frame + controls */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-5 -mt-16">
        {/* Corner brackets */}
        <div className="relative" style={{ width: 280, height: 160 }}>
          {(["tl","tr","bl","br"] as const).map((c) => (
            <div key={c} className="absolute w-9 h-9" style={{
              top:    c[0]==="t" ? 0 : "auto", bottom: c[0]==="b" ? 0 : "auto",
              left:   c[1]==="l" ? 0 : "auto", right:  c[1]==="r" ? 0 : "auto",
              borderTop:    c[0]==="t" ? `3px solid ${borderColor}` : "none",
              borderBottom: c[0]==="b" ? `3px solid ${borderColor}` : "none",
              borderLeft:   c[1]==="l" ? `3px solid ${borderColor}` : "none",
              borderRight:  c[1]==="r" ? `3px solid ${borderColor}` : "none",
              borderRadius: c==="tl"?"8px 0 0 0":c==="tr"?"0 8px 0 0":c==="bl"?"0 0 0 8px":"0 0 8px 0",
              transition: "border-color 0.3s",
            }} />
          ))}
          {!detected && ready && !analyzing && (
            <div className="absolute left-4 right-4 h-px"
              style={{ background: `linear-gradient(90deg,transparent,${borderColor},transparent)`,
                animation: "scan-sweep 2s ease-in-out infinite", top: "50%" }} />
          )}
          {detected && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full size-12 flex items-center justify-center"
                style={{ background: "rgba(74,222,128,0.2)", border: "2px solid #4ade80" }}>
                <Check size={24} color="#4ade80" strokeWidth={3} />
              </div>
            </div>
          )}
        </div>

        {/* Status hint */}
        <div className="text-center px-8">
          {cameraError ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm" style={{ color: "rgba(255,100,100,0.9)" }}>Câmera não disponível</p>
              <button onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "var(--gold,#FFD23F)", color: "#1a1300" }}>
                Tirar foto
              </button>
            </div>
          ) : !ready ? (
            <div className="flex items-center justify-center gap-2" style={{ color: "rgba(255,255,255,0.6)" }}>
              <Loader2 size={14} className="animate-spin" />
              <span className="text-sm">Iniciando câmera…</span>
            </div>
          ) : detected ? (
            <p className="text-sm font-semibold" style={{ color: "#4ade80" }}>Figurinha detectada!</p>
          ) : analyzing ? (
            <div className="flex items-center justify-center gap-2" style={{ color: "rgba(255,184,0,0.9)" }}>
              <Loader2 size={13} className="animate-spin" />
              <span className="text-sm">Analisando…</span>
            </div>
          ) : (
            <>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                Aponte para o código no verso da figurinha
              </p>
              {!hasTextDetector && (
                <p className="text-xs mt-1" style={{ color: "rgba(255,184,0,0.75)" }}>
                  Mantenha firme e bem iluminado
                </p>
              )}
            </>
          )}
        </div>

        {/* Flash + flip */}
        {!detected && (
          <div className="flex items-center gap-12">
            <button onClick={toggleTorch} className="flex flex-col items-center gap-1.5">
              {torchOn ? <Zap size={26} color="#FFD23F" fill="#FFD23F" /> : <ZapOff size={26} color="rgba(255,255,255,0.6)" />}
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Flash</span>
            </button>
            <button onClick={flipCamera} className="flex flex-col items-center gap-1.5">
              <RotateCcw size={26} color="rgba(255,255,255,0.6)" />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Câmera</span>
            </button>
          </div>
        )}
      </div>

      {/* Manual input overlay */}
      {manualInput && (
        <div className="absolute inset-0 z-20 flex items-end"
          style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setManualInput(false)}>
          <div className="w-full rounded-t-3xl px-6 pt-4 pb-10 flex flex-col gap-4"
            style={{ background: "var(--bg-1,#0d1526)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto" style={{ background: "rgba(255,255,255,0.2)" }} />
            <p className="font-semibold text-white text-center">Digitar código</p>
            <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
              Ex: QAT12, BRA 5, FWC3, CC2
            </p>
            <input autoFocus value={manualCode} onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitManual()}
              placeholder="QAT12"
              className="px-4 py-3 rounded-xl text-lg font-mono text-center uppercase"
              style={{ background: "var(--bg-0,#060d1a)", border: "1px solid rgba(255,255,255,0.15)",
                color: "white", outline: "none", letterSpacing: "0.1em" }} />
            <div className="flex gap-3">
              <button onClick={() => setManualInput(false)} className="flex-1 py-3 rounded-xl font-semibold text-sm"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                Cancelar
              </button>
              <button onClick={submitManual} className="flex-1 py-3 rounded-xl font-semibold text-sm"
                style={{ background: "var(--gold,#FFD23F)", color: "#1a1300" }}>
                Buscar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detection bottom sheet */}
      {(detected || saving) && (
        <div className="relative z-10 rounded-t-3xl px-6 pt-3 pb-8 flex flex-col gap-3"
          style={{ background: "var(--bg-1,#0d1526)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{ background: "rgba(255,255,255,0.18)" }} />
          <p className="text-center font-bold text-lg text-white">Figurinha Detectada</p>

          {sticker ? (
            <p className="text-center font-black" style={{ fontSize: 32, color: "var(--gold,#FFD23F)", letterSpacing: "0.06em" }}>
              {sticker.countryCode} {sticker.number}
            </p>
          ) : (
            <p className="text-center font-black" style={{ fontSize: 28, color: "var(--gold,#FFD23F)" }}>
              {detection?.stickerId}
            </p>
          )}

          <p className="text-center text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            {sticker ? (sticker.playerName ?? sticker.country) : "Figurinha não encontrada no álbum"}
          </p>

          {sticker && (
            <div className="flex justify-center">
              {detection!.isOwned ? (
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                  style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)" }}>
                  <AlertCircle size={15} color="#f59e0b" />
                  <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 13 }}>Repetida!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                  style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.35)" }}>
                  <Check size={15} color="#34d399" />
                  <span style={{ color: "#34d399", fontWeight: 700, fontSize: 13 }}>Figurinha nova!</span>
                </div>
              )}
            </div>
          )}

          {sticker && (
            <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              {detection!.isOwned ? "Marcar como repetida" : "Marcar como obtida"}
            </p>
          )}

          {sticker ? (
            <button onClick={confirm} disabled={saving}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 text-white"
              style={{ background: "#3b5bdb" }}>
              {saving && <Loader2 size={17} className="animate-spin" />}
              Confirmar e continuar
            </button>
          ) : (
            <button onClick={dismiss}
              className="w-full py-4 rounded-2xl font-bold text-base text-white"
              style={{ background: "rgba(255,255,255,0.1)" }}>
              Tentar novamente
            </button>
          )}

          <button onClick={dismiss} className="w-full py-4 rounded-2xl font-bold text-base"
            style={{ color: "#3b5bdb", border: "2px solid #3b5bdb", background: "transparent" }}>
            Não confirmar e continuar
          </button>

          <button onClick={onClose} className="text-center text-sm py-1" style={{ color: "rgba(255,255,255,0.3)" }}>
            Finalizar
          </button>
        </div>
      )}

      <style>{`
        @keyframes scan-sweep {
          0%,100% { top: 10%; opacity: 0.2; }
          50%      { top: 80%; opacity: 1;   }
        }
      `}</style>
    </div>,
    document.body
  )
}
