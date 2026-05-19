"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { X, Zap, ZapOff, RotateCcw, Loader2, Check, AlertCircle, Keyboard, Camera } from "lucide-react"
import type { Worker as TesseractWorker } from "tesseract.js"
import { getStickerById, ALL_STICKERS } from "@/lib/data/stickers"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

/* ── helpers ──────────────────────────────────────────────── */
const VALID_CODES = new Set(ALL_STICKERS.map((s) => s.countryCode))

function parseStickerCode(text: string): string | null {
  const upper = text.toUpperCase().replace(/[^A-Z0-9]/g, " ").replace(/\s+/g, " ").trim()
  const patterns = [/\b([A-Z]{2,3})\s*(\d{1,3})\b/g, /\b(\d{1,3})\s*([A-Z]{2,3})\b/g]
  for (const pattern of patterns) {
    let match; pattern.lastIndex = 0
    while ((match = pattern.exec(upper)) !== null) {
      const [, a, b] = match
      const isACode = isNaN(Number(a))
      const code = isACode ? a : b
      const num  = parseInt(isACode ? b : a, 10)
      if (VALID_CODES.has(code) && !isNaN(num) && num >= 1 && num <= 99)
        return `${code}${num}`
    }
  }
  return null
}

// Detect if native TextDetector is available (Chrome Android)
const NATIVE_OCR = typeof window !== "undefined" && "TextDetector" in window

/* ── types ────────────────────────────────────────────────── */
interface Detection { stickerId: string; isOwned: boolean }
interface Props {
  userId: string; owned: Set<string>
  onClose: () => void
  onCollectionAdd: (id: string) => void
  onDuplicateAdd:  (id: string) => void
}

/* ── component ────────────────────────────────────────────── */
export default function StickerScannerModal({ userId, owned, onClose, onCollectionAdd, onDuplicateAdd }: Props) {
  const videoRef     = useRef<HTMLVideoElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const workerRef    = useRef<TesseractWorker | null>(null)
  const streamRef    = useRef<MediaStream | null>(null)
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [ready,       setReady]       = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const [torchOn,     setTorchOn]     = useState(false)
  const [facing,      setFacing]      = useState<"user"|"environment">("environment")
  const [detection,   setDetection]   = useState<Detection | null>(null)
  const [capturing,   setCapturing]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [manualInput, setManualInput] = useState(false)
  const [manualCode,  setManualCode]  = useState("")
  const supabase = createClient()

  /* ── camera ───────────────────────────────────────────── */
  const stopStream = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async (mode: "user"|"environment") => {
    stopStream()
    let s: MediaStream
    try { s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: mode } } }) }
    catch { s = await navigator.mediaDevices.getUserMedia({ video: true }) }
    streamRef.current = s
    if (videoRef.current) {
      videoRef.current.srcObject = s
      await videoRef.current.play().catch(() => {})
    }
  }, [stopStream])

  /* ── native TextDetector loop (Chrome Android) ────────── */
  const runNativeScan = useCallback(async () => {
    if (!videoRef.current || detection) return
    const video = videoRef.current
    if (video.readyState < 2 || video.videoWidth === 0) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).TextDetector()
      const blocks: Array<{ rawValue: string }> = await detector.detect(video)
      for (const b of blocks) {
        const id = parseStickerCode(b.rawValue)
        if (id) {
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
          setDetection({ stickerId: id, isOwned: owned.has(id) })
          return
        }
      }
    } catch { /* detection failed, continue */ }
  }, [detection, owned])

  /* ── init ─────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false
    async function init() {
      await startCamera("environment")
      if (cancelled) return
      if (!NATIVE_OCR) {
        // Load Tesseract only for the one-shot capture button (not in live loop)
        const { createWorker } = await import("tesseract.js")
        const worker = await createWorker("eng")
        if (cancelled) { worker.terminate(); return }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (worker as any).setParameters({
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ",
          tessedit_pageseg_mode: "11",
        })
        workerRef.current = worker
      } else {
        // Native OCR: poll every 800 ms
        timerRef.current = setInterval(runNativeScan, 800)
      }
      setReady(true)
    }
    init().catch(() => setCameraError(true))
    return () => {
      cancelled = true
      stopStream()
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* Restart native scan loop after dismiss */
  useEffect(() => {
    if (ready && NATIVE_OCR && !detection) {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(runNativeScan, 800)
    }
  }, [detection, ready, runNativeScan])

  /* ── one-shot Tesseract capture (non-native browsers) ─── */
  async function capture() {
    if (!videoRef.current || !canvasRef.current) return
    setCapturing(true)
    const video  = videoRef.current
    const canvas = canvasRef.current
    const ctx    = canvas.getContext("2d")!
    const scale  = Math.min(1, 900 / Math.max(video.videoWidth, video.videoHeight))
    canvas.width  = Math.round(video.videoWidth  * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    // Grayscale
    const id = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const d = id.data
    for (let i = 0; i < d.length; i += 4) {
      const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      d[i] = d[i + 1] = d[i + 2] = g
    }
    ctx.putImageData(id, 0, 0)
    try {
      if (workerRef.current) {
        const { data: { text } } = await workerRef.current.recognize(canvas)
        const stickerId = parseStickerCode(text)
        if (stickerId) setDetection({ stickerId, isOwned: owned.has(stickerId) })
        else { toast.error("Não encontrei o código. Tente digitar manualmente."); setManualInput(true) }
      }
    } catch { toast.error("Erro na leitura. Use o teclado."); setManualInput(true) }
    setCapturing(false)
  }

  /* ── file input fallback ──────────────────────────────── */
  async function handleFile(file: File) {
    setCapturing(true)
    try {
      const { createWorker } = await import("tesseract.js")
      const worker = await createWorker("eng")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (worker as any).setParameters({ tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 " })
      const url = URL.createObjectURL(file)
      const { data: { text } } = await worker.recognize(url)
      await worker.terminate(); URL.revokeObjectURL(url)
      const id = parseStickerCode(text)
      if (id) { setDetection({ stickerId: id, isOwned: owned.has(id) }); setCameraError(false) }
      else { toast.error("Não encontrei o código. Tente digitar manualmente."); setManualInput(true) }
    } catch { toast.error("Erro na leitura. Use o teclado."); setManualInput(true) }
    setCapturing(false)
  }

  /* ── torch ────────────────────────────────────────────── */
  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    const next = !torchOn
    try { await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] }); setTorchOn(next) }
    catch { toast.error("Flash não disponível") }
  }

  /* ── flip ─────────────────────────────────────────────── */
  async function flipCamera() {
    const next = facing === "environment" ? "user" : "environment"
    setFacing(next); await startCamera(next)
  }

  /* ── manual ───────────────────────────────────────────── */
  function submitManual() {
    const id = parseStickerCode(manualCode.toUpperCase())
    if (id) { setDetection({ stickerId: id, isOwned: owned.has(id) }); setManualInput(false); setManualCode("") }
    else toast.error("Código inválido. Ex: QAT2, BRA 5, FWC3")
  }

  /* ── dismiss ──────────────────────────────────────────── */
  function dismiss() { setDetection(null) }

  /* ── confirm ──────────────────────────────────────────── */
  async function confirm() {
    if (!detection) return
    setSaving(true)
    const { stickerId, isOwned } = detection
    if (!isOwned) {
      const { error } = await supabase.from("user_collection").upsert({ user_id: userId, sticker_id: stickerId })
      if (error) { toast.error("Erro ao salvar"); setSaving(false); return }
      onCollectionAdd(stickerId); toast.success("Figurinha colada na coleção!")
    } else {
      const { data: existing } = await supabase.from("user_duplicates")
        .select("quantity").eq("user_id", userId).eq("sticker_id", stickerId).single()
      const qty = (existing?.quantity ?? 0) + 1
      const { error } = await supabase.from("user_duplicates")
        .upsert({ user_id: userId, sticker_id: stickerId, quantity: qty }, { onConflict: "user_id,sticker_id" })
      if (error) { toast.error("Erro ao salvar"); setSaving(false); return }
      onDuplicateAdd(stickerId); toast.success("Adicionada às repetidas!")
    }
    setSaving(false); dismiss()
  }

  const sticker     = detection ? getStickerById(detection.stickerId) : null
  const detected    = detection !== null
  const borderColor = detected ? "#4ade80" : "#FFD23F"

  /* ── render ───────────────────────────────────────────── */
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black">
      {/* pointer-events-none prevents video from swallowing touches */}
      <video ref={videoRef} autoPlay playsInline muted
        className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = "" }} />

      {/* semi-transparent overlay — pointer-events-none so buttons work */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(0,0,0,0.45)" }} />

      {/* ── top bar ─────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-14 pb-4">
        <button onClick={onClose}
          className="size-11 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <X size={20} color="white" />
        </button>
        <span className="text-white font-semibold">Scanner de Figurinhas</span>
        <button onClick={() => setManualInput(true)}
          className="size-11 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <Keyboard size={18} color="white" />
        </button>
      </div>

      {/* ── center area ─────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6">
        {/* Scan frame */}
        <div className="relative" style={{ width: 280, height: 160 }}>
          {(["tl","tr","bl","br"] as const).map((c) => (
            <div key={c} className="absolute w-9 h-9" style={{
              top: c[0]==="t"?0:"auto", bottom: c[0]==="b"?0:"auto",
              left: c[1]==="l"?0:"auto", right: c[1]==="r"?0:"auto",
              borderTop:    c[0]==="t"?`3px solid ${borderColor}`:"none",
              borderBottom: c[0]==="b"?`3px solid ${borderColor}`:"none",
              borderLeft:   c[1]==="l"?`3px solid ${borderColor}`:"none",
              borderRight:  c[1]==="r"?`3px solid ${borderColor}`:"none",
              borderRadius: c==="tl"?"8px 0 0 0":c==="tr"?"0 8px 0 0":c==="bl"?"0 0 0 8px":"0 0 8px 0",
              transition: "border-color 0.3s",
            }} />
          ))}
          {NATIVE_OCR && !detected && ready && (
            <div className="absolute left-4 right-4 h-px"
              style={{ background:`linear-gradient(90deg,transparent,${borderColor},transparent)`,
                animation:"scan-sweep 2s ease-in-out infinite", top:"50%" }} />
          )}
          {detected && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full size-12 flex items-center justify-center"
                style={{ background:"rgba(74,222,128,0.2)", border:"2px solid #4ade80" }}>
                <Check size={24} color="#4ade80" strokeWidth={3} />
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="text-center px-8">
          {cameraError ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm" style={{ color:"rgba(255,100,100,0.9)" }}>Câmera não disponível</p>
              <button onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background:"var(--gold,#FFD23F)", color:"#1a1300" }}>
                Tirar foto
              </button>
            </div>
          ) : !ready ? (
            <div className="flex items-center gap-2" style={{ color:"rgba(255,255,255,0.6)" }}>
              <Loader2 size={14} className="animate-spin" />
              <span className="text-sm">Iniciando câmera…</span>
            </div>
          ) : detected ? (
            <p className="text-sm font-semibold" style={{ color:"#4ade80" }}>Figurinha detectada!</p>
          ) : NATIVE_OCR ? (
            <p className="text-sm" style={{ color:"rgba(255,255,255,0.8)" }}>
              Aponte para o código no verso da figurinha
            </p>
          ) : (
            <p className="text-sm" style={{ color:"rgba(255,255,255,0.8)" }}>
              Enquadre o código e toque em <strong style={{ color:"var(--gold,#FFD23F)" }}>Capturar</strong>
            </p>
          )}
        </div>

        {/* Controls */}
        {!detected && (
          <div className="flex items-center gap-10">
            <button onClick={toggleTorch} className="flex flex-col items-center gap-1.5">
              {torchOn
                ? <Zap size={26} color="#FFD23F" fill="#FFD23F" />
                : <ZapOff size={26} color="rgba(255,255,255,0.55)" />}
              <span className="text-xs" style={{ color:"rgba(255,255,255,0.45)" }}>Flash</span>
            </button>

            {/* Capture button — only shown when TextDetector is unavailable */}
            {!NATIVE_OCR && ready && (
              <button onClick={capture} disabled={capturing}
                className="size-16 rounded-full flex items-center justify-center"
                style={{ background:"var(--gold,#FFD23F)", boxShadow:"0 0 0 4px rgba(255,210,63,0.25)" }}>
                {capturing
                  ? <Loader2 size={24} color="#1a1300" className="animate-spin" />
                  : <Camera size={24} color="#1a1300" />}
              </button>
            )}

            <button onClick={flipCamera} className="flex flex-col items-center gap-1.5">
              <RotateCcw size={26} color="rgba(255,255,255,0.55)" />
              <span className="text-xs" style={{ color:"rgba(255,255,255,0.45)" }}>Câmera</span>
            </button>
          </div>
        )}
      </div>

      {/* ── manual input sheet ──────────────────────────── */}
      {manualInput && (
        <div className="absolute inset-0 z-20 flex items-end"
          style={{ background:"rgba(0,0,0,0.65)" }}
          onClick={() => setManualInput(false)}>
          <div className="w-full rounded-t-3xl px-6 pt-4 pb-10 flex flex-col gap-4"
            style={{ background:"var(--bg-1,#0d1526)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto" style={{ background:"rgba(255,255,255,0.2)" }} />
            <p className="font-semibold text-white text-center">Digitar código</p>
            <p className="text-sm text-center" style={{ color:"rgba(255,255,255,0.45)" }}>
              Ex: QAT2, BRA 5, FWC3, CC2
            </p>
            <input autoFocus value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key==="Enter" && submitManual()}
              placeholder="QAT2"
              className="px-4 py-3 rounded-xl text-lg font-mono text-center uppercase"
              style={{ background:"rgba(0,0,0,0.4)", border:"1px solid rgba(255,255,255,0.15)",
                color:"white", outline:"none", letterSpacing:"0.1em" }} />
            <div className="flex gap-3">
              <button onClick={() => setManualInput(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-sm"
                style={{ background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.55)" }}>
                Cancelar
              </button>
              <button onClick={submitManual}
                className="flex-1 py-3 rounded-xl font-semibold text-sm"
                style={{ background:"var(--gold,#FFD23F)", color:"#1a1300" }}>
                Buscar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── detection bottom sheet ───────────────────────── */}
      {(detected || saving) && (
        <div className="relative z-10 rounded-t-3xl px-6 pt-3 pb-10 flex flex-col gap-3"
          style={{ background:"var(--bg-1,#0d1526)", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
          <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{ background:"rgba(255,255,255,0.18)" }} />
          <p className="text-center font-bold text-lg text-white">Figurinha Detectada</p>

          <p className="text-center font-black" style={{ fontSize:32, color:"var(--gold,#FFD23F)", letterSpacing:"0.06em" }}>
            {sticker ? `${sticker.countryCode} ${sticker.number}` : detection?.stickerId}
          </p>

          <p className="text-center text-sm" style={{ color:"rgba(255,255,255,0.5)" }}>
            {sticker ? (sticker.playerName ?? sticker.country) : "Figurinha não encontrada no álbum"}
          </p>

          {sticker && (
            <div className="flex justify-center">
              {detection!.isOwned ? (
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                  style={{ background:"rgba(245,158,11,0.12)", border:"1px solid rgba(245,158,11,0.35)" }}>
                  <AlertCircle size={15} color="#f59e0b" />
                  <span style={{ color:"#f59e0b", fontWeight:700, fontSize:13 }}>Repetida!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                  style={{ background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.35)" }}>
                  <Check size={15} color="#34d399" />
                  <span style={{ color:"#34d399", fontWeight:700, fontSize:13 }}>Figurinha nova!</span>
                </div>
              )}
            </div>
          )}

          {sticker ? (
            <button onClick={confirm} disabled={saving}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 text-white"
              style={{ background:"#3b5bdb" }}>
              {saving && <Loader2 size={17} className="animate-spin" />}
              Confirmar e continuar
            </button>
          ) : (
            <button onClick={dismiss}
              className="w-full py-4 rounded-2xl font-bold text-base text-white"
              style={{ background:"rgba(255,255,255,0.1)" }}>
              Tentar novamente
            </button>
          )}

          <button onClick={dismiss}
            className="w-full py-4 rounded-2xl font-bold text-base"
            style={{ color:"#3b5bdb", border:"2px solid #3b5bdb", background:"transparent" }}>
            Não confirmar e continuar
          </button>

          <button onClick={onClose}
            className="text-center text-sm py-1" style={{ color:"rgba(255,255,255,0.3)" }}>
            Finalizar
          </button>
        </div>
      )}

      <style>{`
        @keyframes scan-sweep {
          0%,100% { top:10%; opacity:.2; }
          50%      { top:82%; opacity:1;  }
        }
      `}</style>
    </div>,
    document.body
  )
}
