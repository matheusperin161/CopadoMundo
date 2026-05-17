"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { X, Zap, ZapOff, RotateCcw, Loader2, Check, AlertCircle } from "lucide-react"
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
      if (!VALID_CODES.has(code) || isNaN(num) || num < 1) continue
      const id = `${code}${num}`
      if (getStickerById(id)) return id
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

export default function StickerScannerModal({ userId, owned, onClose, onCollectionAdd, onDuplicateAdd }: Props) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const workerRef  = useRef<TesseractWorker | null>(null)
  const streamRef  = useRef<MediaStream | null>(null)
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const busyRef    = useRef(false)

  const [ready,     setReady]     = useState(false)
  const [torchOn,   setTorchOn]   = useState(false)
  const [facing,    setFacing]    = useState<"user" | "environment">("environment")
  const [detection, setDetection] = useState<Detection | null>(null)
  const [saving,    setSaving]    = useState(false)
  const supabase = createClient()

  /* ── camera ──────────────────────────────────────────── */
  const stopStream = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async (mode: "user" | "environment") => {
    stopStream()
    const s = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
    })
    streamRef.current = s
    if (videoRef.current) videoRef.current.srcObject = s
  }, [stopStream])

  /* ── OCR scan frame ───────────────────────────────────── */
  const scanFrame = useCallback(async () => {
    if (busyRef.current || !videoRef.current || !canvasRef.current || !workerRef.current) return
    const video = videoRef.current
    if (video.readyState < 2 || video.videoWidth === 0) return
    busyRef.current = true
    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")!
      const bw = Math.round(video.videoWidth * 0.65)
      const bh = Math.round(bw * 0.38)
      const sx = (video.videoWidth - bw) / 2
      const sy = video.videoHeight * 0.28
      canvas.width = bw; canvas.height = bh
      ctx.drawImage(video, sx, sy, bw, bh, 0, 0, bw, bh)
      // grayscale + contrast
      const id = ctx.getImageData(0, 0, bw, bh)
      const d = id.data
      for (let i = 0; i < d.length; i += 4) {
        const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        const c = Math.min(255, Math.max(0, (g - 128) * 2.2 + 128))
        d[i] = d[i + 1] = d[i + 2] = c
      }
      ctx.putImageData(id, 0, 0)
      const { data: { text } } = await workerRef.current.recognize(canvas)
      const stickerId = parseStickerCode(text)
      if (stickerId) {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        setDetection({ stickerId, isOwned: owned.has(stickerId) })
      }
    } finally {
      busyRef.current = false
    }
  }, [owned])

  const startScanning = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(scanFrame, 1800)
  }, [scanFrame])

  /* ── init ─────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false
    async function init() {
      await startCamera("environment")
      if (cancelled) return
      const { createWorker } = await import("tesseract.js")
      const worker = await createWorker("eng")
      if (cancelled) { worker.terminate(); return }
      workerRef.current = worker
      setReady(true)
      startScanning()
    }
    init().catch(() => toast.error("Não foi possível acessar a câmera"))
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
    if (workerRef.current) startScanning()
  }

  /* ── dismiss detection & resume scan ──────────────────── */
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

  const sticker = detection ? getStickerById(detection.stickerId) : null
  const detected = detection !== null
  const borderColor = detected ? "#4ade80" : "#FFD23F"

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black overflow-hidden">
      {/* Live camera */}
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Dark overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(0,0,0,0.5)" }} />

      {/* ── Top bar ─────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-12 pb-4">
        <button
          onClick={onClose}
          className="size-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <X size={20} color="white" />
        </button>
        <span className="text-white font-semibold text-base">Scanner de Figurinhas</span>
        <div className="w-10" />
      </div>

      {/* ── Scan box ────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-4 -mt-16">
        {/* Frame */}
        <div className="relative" style={{ width: 280, height: 160 }}>
          {/* corner brackets */}
          {(["tl","tr","bl","br"] as const).map((c) => (
            <div key={c} className="absolute w-8 h-8" style={{
              top:    c[0] === "t" ? 0 : "auto",
              bottom: c[0] === "b" ? 0 : "auto",
              left:   c[1] === "l" ? 0 : "auto",
              right:  c[1] === "r" ? 0 : "auto",
              borderTop:    c[0] === "t" ? `2.5px solid ${borderColor}` : "none",
              borderBottom: c[0] === "b" ? `2.5px solid ${borderColor}` : "none",
              borderLeft:   c[1] === "l" ? `2.5px solid ${borderColor}` : "none",
              borderRight:  c[1] === "r" ? `2.5px solid ${borderColor}` : "none",
              borderRadius: `${c[0] === "t" ? "8px" : "0"} ${c[1] === "r" && c[0] === "t" ? "8px" : "0"} ${c[0] === "b" && c[1] === "r" ? "8px" : "0"} ${c[0] === "b" && c[1] === "l" ? "8px" : "0"}`,
              transition: "border-color 0.3s",
            }} />
          ))}

          {/* Scan line */}
          {!detected && ready && (
            <div
              className="absolute left-4 right-4 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, ${borderColor}, transparent)`,
                animation: "scan-sweep 1.8s ease-in-out infinite",
                top: "50%",
              }}
            />
          )}

          {/* Detected check */}
          {detected && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full size-12 flex items-center justify-center"
                style={{ background: "rgba(74,222,128,0.2)", border: "2px solid #4ade80" }}>
                <Check size={24} color="#4ade80" strokeWidth={3} />
              </div>
            </div>
          )}
        </div>

        {/* Hint */}
        <div className="text-center px-8">
          {!ready ? (
            <div className="flex items-center justify-center gap-2" style={{ color: "rgba(255,255,255,0.6)" }}>
              <Loader2 size={14} className="animate-spin" />
              <span className="text-sm">Iniciando câmera…</span>
            </div>
          ) : detected ? (
            <p className="text-sm font-semibold" style={{ color: "#4ade80" }}>Figurinha detectada!</p>
          ) : (
            <>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                Aponte a câmera para o número da figurinha
              </p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,184,0,0.85)" }}>
                Aponte para o verso, onde está o código impresso
              </p>
            </>
          )}
        </div>

        {/* Flash + flip */}
        {!detected && (
          <div className="flex items-center gap-12 mt-4">
            <button onClick={toggleTorch} className="flex flex-col items-center gap-1.5">
              {torchOn
                ? <Zap size={26} color="#FFD23F" fill="#FFD23F" />
                : <ZapOff size={26} color="rgba(255,255,255,0.6)" />}
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>Flash</span>
            </button>
            <button onClick={flipCamera} className="flex flex-col items-center gap-1.5">
              <RotateCcw size={26} color="rgba(255,255,255,0.6)" />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>Câmera</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Detection bottom sheet ───────────────────────── */}
      {detected && sticker && (
        <div
          className="relative z-10 rounded-t-3xl px-6 pt-3 pb-8 flex flex-col gap-3"
          style={{ background: "var(--bg-1, #0d1526)", borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{ background: "rgba(255,255,255,0.18)" }} />

          <p className="text-center font-bold text-lg text-white">Figurinha Detectada</p>

          <p className="text-center font-black" style={{ fontSize: 32, color: "var(--gold, #FFD23F)", letterSpacing: "0.06em" }}>
            {sticker.countryCode} {sticker.number}
          </p>

          <p className="text-center text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            {sticker.playerName ?? sticker.country}
          </p>

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

          <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            {detection!.isOwned ? "Marcar como repetida" : "Marcar como obtida"}
          </p>

          <button
            onClick={confirm}
            disabled={saving}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 text-white"
            style={{ background: "#3b5bdb" }}
          >
            {saving && <Loader2 size={17} className="animate-spin" />}
            Confirmar e continuar
          </button>

          <button
            onClick={dismiss}
            className="w-full py-4 rounded-2xl font-bold text-base"
            style={{ color: "#3b5bdb", border: "2px solid #3b5bdb", background: "transparent" }}
          >
            Não confirmar e continuar
          </button>

          <button onClick={onClose} className="text-center text-sm py-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            Finalizar
          </button>
        </div>
      )}

      <style>{`
        @keyframes scan-sweep {
          0%   { top: 15%; opacity: 0.3; }
          50%  { top: 75%; opacity: 1;   }
          100% { top: 15%; opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
