"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { X, Zap, ZapOff, RotateCcw, Loader2, Check, AlertCircle, Keyboard } from "lucide-react"
import { getStickerById, ALL_STICKERS } from "@/lib/data/stickers"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

/* ── parser ───────────────────────────────────────────────── */
const VALID_CODES = new Set(ALL_STICKERS.map((s) => s.countryCode))

function parse(text: string): string | null {
  const upper = text.toUpperCase().replace(/[^A-Z0-9]/g, " ").replace(/\s+/g, " ").trim()
  for (const re of [/\b([A-Z]{2,3})\s*(\d{1,2})\b/g, /\b(\d{1,2})\s*([A-Z]{2,3})\b/g]) {
    let m; re.lastIndex = 0
    while ((m = re.exec(upper)) !== null) {
      const isACode = isNaN(Number(m[1]))
      const code = isACode ? m[1] : m[2]
      const num  = parseInt(isACode ? m[2] : m[1], 10)
      if (VALID_CODES.has(code) && num >= 1 && num <= 99) return `${code}${num}`
    }
  }
  return null
}

/* ── canvas helpers ───────────────────────────────────────── */
function drawGray(video: HTMLVideoElement, canvas: HTMLCanvasElement, maxPx = 700) {
  const scale = Math.min(1, maxPx / Math.max(video.videoWidth, video.videoHeight))
  canvas.width  = Math.round(video.videoWidth  * scale)
  canvas.height = Math.round(video.videoHeight * scale)
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  const id = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = id.data
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
    d[i] = d[i + 1] = d[i + 2] = g
  }
  ctx.putImageData(id, 0, 0)
}

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
  const videoRef    = useRef<HTMLVideoElement>(null)
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const scanningRef = useRef(false)          // prevents overlapping scans
  const fileRef     = useRef<HTMLInputElement>(null)

  const [ready,       setReady]       = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const [torchOn,     setTorchOn]     = useState(false)
  const [facing,      setFacing]      = useState<"user"|"environment">("environment")
  const [detection,   setDetection]   = useState<Detection | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [manualInput, setManualInput] = useState(false)
  const [manualCode,  setManualCode]  = useState("")
  const [pulse,       setPulse]       = useState(false)   // visual feedback while scanning
  const supabase = createClient()

  /* ── camera ─────────────────────────────────────────────── */
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
    if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play().catch(()=>{}) }
  }, [stopStream])

  /* ── one scan attempt — returns detected stickerId or null ─ */
  const tryScan = useCallback(async (): Promise<string | null> => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) return null

    // 1. Native TextDetector (Chrome 74+ Android — instant)
    if ("TextDetector" in window) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const det = new (window as any).TextDetector()
        const blocks: Array<{ rawValue: string }> = await det.detect(video)
        for (const b of blocks) { const id = parse(b.rawValue); if (id) return id }
        return null
      } catch { /* fall through to Tesseract */ }
    }

    // 2. Tesseract.js with 5-second hard timeout and fresh worker each call
    drawGray(video, canvas)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85)

    const { createWorker } = await import("tesseract.js")
    const worker = await createWorker("eng")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (worker as any).setParameters({
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ",
      tessedit_pageseg_mode: "11",
    })

    const timeout  = new Promise<null>((res) => setTimeout(() => res(null), 5000))
    const ocr      = worker.recognize(dataUrl)
      .then(({ data: { text } }) => parse(text))
      .catch(() => null)

    const result = await Promise.race([ocr, timeout])
    worker.terminate()   // always terminate — fresh worker each time avoids hangs
    return result
  }, [])

  /* ── scan loop ───────────────────────────────────────────── */
  const startLoop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)

    // Choose interval: TextDetector is instant (700ms), Tesseract is slower (2.5s)
    const interval = "TextDetector" in window ? 700 : 2500

    timerRef.current = setInterval(async () => {
      if (scanningRef.current || detection) return
      scanningRef.current = true
      setPulse(true)
      const id = await tryScan()
      setPulse(false)
      scanningRef.current = false
      if (id) {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        setDetection({ stickerId: id, isOwned: owned.has(id) })
      }
    }, interval)
  }, [tryScan, owned, detection])

  /* ── init ────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false
    startCamera("environment")
      .then(() => { if (!cancelled) { setReady(true); startLoop() } })
      .catch(() => setCameraError(true))
    return () => { cancelled = true; stopStream() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* restart loop after a detection is dismissed */
  useEffect(() => {
    if (ready && !detection) startLoop()
  }, [detection, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── controls ────────────────────────────────────────────── */
  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0]; if (!track) return
    const next = !torchOn
    try { await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] }); setTorchOn(next) }
    catch { toast.error("Flash não disponível") }
  }

  async function flipCamera() {
    const next = facing === "environment" ? "user" : "environment"
    setFacing(next); await startCamera(next)
    if (ready) startLoop()
  }

  /* ── manual input ────────────────────────────────────────── */
  function submitManual() {
    const id = parse(manualCode.toUpperCase())
    if (id) { setDetection({ stickerId: id, isOwned: owned.has(id) }); setManualInput(false); setManualCode("") }
    else toast.error("Código inválido — ex: QAT2, BRA 5, FWC3")
  }

  /* ── file fallback ───────────────────────────────────────── */
  async function handleFile(file: File) {
    const { createWorker } = await import("tesseract.js")
    const worker = await createWorker("eng")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (worker as any).setParameters({ tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 " })
    const url = URL.createObjectURL(file)
    const { data: { text } } = await worker.recognize(url).catch(() => ({ data: { text: "" } }))
    await worker.terminate(); URL.revokeObjectURL(url)
    const id = parse(text)
    if (id) { setDetection({ stickerId: id, isOwned: owned.has(id) }); setCameraError(false) }
    else { toast.error("Não encontrei o código — use o teclado"); setManualInput(true) }
  }

  /* ── confirm ─────────────────────────────────────────────── */
  async function confirm() {
    if (!detection) return
    setSaving(true)
    const { stickerId, isOwned } = detection
    if (!isOwned) {
      const { error } = await supabase.from("user_collection").upsert({ user_id: userId, sticker_id: stickerId })
      if (error) { toast.error("Erro ao salvar"); setSaving(false); return }
      onCollectionAdd(stickerId); toast.success("Figurinha colada na coleção!")
    } else {
      const { data: ex } = await supabase.from("user_duplicates")
        .select("quantity").eq("user_id", userId).eq("sticker_id", stickerId).single()
      const { error } = await supabase.from("user_duplicates")
        .upsert({ user_id: userId, sticker_id: stickerId, quantity: (ex?.quantity ?? 0) + 1 }, { onConflict: "user_id,sticker_id" })
      if (error) { toast.error("Erro ao salvar"); setSaving(false); return }
      onDuplicateAdd(stickerId); toast.success("Adicionada às repetidas!")
    }
    setSaving(false)
    setDetection(null)
  }

  const sticker     = detection ? getStickerById(detection.stickerId) : null
  const detected    = !!detection
  const borderColor = detected ? "#4ade80" : pulse ? "rgba(255,210,63,0.5)" : "#FFD23F"

  /* ── render ──────────────────────────────────────────────── */
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black">
      {/* pointer-events-none prevents video from blocking touches */}
      <video ref={videoRef} autoPlay playsInline muted
        className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = "" }} />

      {/* overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(0,0,0,0.42)" }} />

      {/* ── top bar ─────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-14 pb-4">
        <button onClick={onClose}
          className="size-11 rounded-full flex items-center justify-center"
          style={{ background:"rgba(0,0,0,0.65)", border:"1px solid rgba(255,255,255,0.18)" }}>
          <X size={20} color="white" />
        </button>
        <span className="text-white font-semibold text-sm">Scanner de Figurinhas</span>
        <button onClick={() => setManualInput(true)}
          className="size-11 rounded-full flex items-center justify-center"
          style={{ background:"rgba(0,0,0,0.65)", border:"1px solid rgba(255,255,255,0.18)" }}>
          <Keyboard size={18} color="white" />
        </button>
      </div>

      {/* ── center ──────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6">

        {/* scan frame */}
        <div className="relative" style={{ width:280, height:160 }}>
          {(["tl","tr","bl","br"] as const).map((c) => (
            <div key={c} style={{
              position:"absolute",
              width:36, height:36,
              top:    c[0]==="t"?0:"auto", bottom: c[0]==="b"?0:"auto",
              left:   c[1]==="l"?0:"auto", right:  c[1]==="r"?0:"auto",
              borderTop:    c[0]==="t"?`3px solid ${borderColor}`:"none",
              borderBottom: c[0]==="b"?`3px solid ${borderColor}`:"none",
              borderLeft:   c[1]==="l"?`3px solid ${borderColor}`:"none",
              borderRight:  c[1]==="r"?`3px solid ${borderColor}`:"none",
              borderRadius: c==="tl"?"8px 0 0 0":c==="tr"?"0 8px 0 0":c==="bl"?"0 0 0 8px":"0 0 8px 0",
              transition:"border-color 0.25s",
            }} />
          ))}

          {/* scan line — visible when scanning, not when detected */}
          {!detected && ready && (
            <div style={{
              position:"absolute", left:8, right:8, height:2, borderRadius:1,
              background:"linear-gradient(90deg,transparent,var(--gold,#FFD23F),transparent)",
              animation:"scan-sweep 2s ease-in-out infinite", top:"50%",
              opacity: pulse ? 1 : 0.6,
            }} />
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

        {/* status text */}
        <div className="text-center px-8">
          {cameraError ? (
            <div className="flex flex-col items-center gap-3">
              <p style={{ color:"rgba(255,100,100,0.9)", fontSize:14 }}>Câmera não disponível</p>
              <button onClick={() => fileRef.current?.click()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background:"var(--gold,#FFD23F)", color:"#1a1300" }}>
                Tirar foto da figurinha
              </button>
            </div>
          ) : !ready ? (
            <div className="flex items-center gap-2" style={{ color:"rgba(255,255,255,0.6)" }}>
              <Loader2 size={14} className="animate-spin" />
              <span style={{ fontSize:14 }}>Iniciando câmera…</span>
            </div>
          ) : detected ? (
            <p style={{ color:"#4ade80", fontWeight:600, fontSize:14 }}>Figurinha detectada!</p>
          ) : (
            <div className="flex items-center gap-2 justify-center" style={{ color:"rgba(255,255,255,0.75)" }}>
              {pulse && <Loader2 size={13} className="animate-spin" style={{ color:"var(--gold,#FFD23F)" }} />}
              <span style={{ fontSize:14 }}>
                {pulse ? "Analisando…" : "Aponte para o código no verso da figurinha"}
              </span>
            </div>
          )}
        </div>

        {/* flash + flip */}
        {!detected && (
          <div className="flex items-center gap-14">
            <button onClick={toggleTorch} className="flex flex-col items-center gap-1.5">
              {torchOn
                ? <Zap size={26} color="#FFD23F" fill="#FFD23F" />
                : <ZapOff size={26} color="rgba(255,255,255,0.55)" />}
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>Flash</span>
            </button>
            <button onClick={flipCamera} className="flex flex-col items-center gap-1.5">
              <RotateCcw size={26} color="rgba(255,255,255,0.55)" />
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>Câmera</span>
            </button>
          </div>
        )}
      </div>

      {/* ── manual input sheet ──────────────────────────── */}
      {manualInput && (
        <div className="absolute inset-0 z-20 flex items-end"
          style={{ background:"rgba(0,0,0,0.7)" }}
          onClick={() => setManualInput(false)}>
          <div className="w-full rounded-t-3xl px-6 pt-4 pb-10 flex flex-col gap-4"
            style={{ background:"var(--bg-1,#0d1526)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto" style={{ background:"rgba(255,255,255,0.2)" }} />
            <p className="font-semibold text-white text-center">Digitar código</p>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.4)", textAlign:"center" }}>
              Ex: QAT2 · BRA 5 · FWC3 · CC2
            </p>
            <input autoFocus value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitManual()}
              placeholder="QAT2"
              className="text-center uppercase"
              style={{
                padding:"14px", borderRadius:14, fontSize:20, fontFamily:"monospace",
                letterSpacing:"0.12em", fontWeight:700,
                background:"rgba(0,0,0,0.45)", border:"1px solid rgba(255,255,255,0.15)",
                color:"white", outline:"none",
              }} />
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
          <p className="text-center font-bold text-white" style={{ fontSize:18 }}>Figurinha Detectada</p>

          <p className="text-center font-black" style={{ fontSize:34, color:"var(--gold,#FFD23F)", letterSpacing:"0.06em" }}>
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
            <button onClick={() => setDetection(null)}
              className="w-full py-4 rounded-2xl font-bold text-base text-white"
              style={{ background:"rgba(255,255,255,0.1)" }}>
              Tentar novamente
            </button>
          )}

          <button onClick={() => setDetection(null)}
            className="w-full py-4 rounded-2xl font-bold text-base"
            style={{ color:"#3b5bdb", border:"2px solid #3b5bdb", background:"transparent" }}>
            Não confirmar e continuar
          </button>

          <button onClick={onClose}
            style={{ fontSize:13, color:"rgba(255,255,255,0.3)", textAlign:"center", paddingTop:4 }}>
            Finalizar
          </button>
        </div>
      )}

      <style>{`
        @keyframes scan-sweep {
          0%,100% { top:8%;  opacity:.25; }
          50%      { top:84%; opacity:1;   }
        }
      `}</style>
    </div>,
    document.body
  )
}
