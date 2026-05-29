"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import jsQR from "jsqr"

interface Props {
  onResult: (userId: string) => void
  onClose: () => void
}

export default function QrScannerModal({ onResult, onClose }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef    = useRef<number>(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
        tick()
      })
      .catch(() => setError("Câmera não disponível ou permissão negada."))

    function tick() {
      const video  = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || !active) return
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width  = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" })
        if (code?.data) {
          // accept https://.../u/<uuid> or just the raw uuid
          const match = code.data.match(/\/u\/([0-9a-f-]{36})/i) ?? code.data.match(/^([0-9a-f-]{36})$/i)
          if (match) {
            active = false
            streamRef.current?.getTracks().forEach((t) => t.stop())
            onResult(match[1])
            return
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    return () => {
      active = false
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [onResult])

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)" }}
    >
      {/* close */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 20, right: 20,
          width: 40, height: 40, borderRadius: "50%",
          background: "rgba(255,255,255,0.1)", border: "none",
          display: "grid", placeItems: "center", cursor: "pointer",
        }}
      >
        <X size={18} color="white" />
      </button>

      <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
        Aponte para o QR Code
      </div>

      {error ? (
        <div style={{ color: "#FF6B6B", fontSize: 14, textAlign: "center", padding: "0 32px" }}>{error}</div>
      ) : (
        <div style={{ position: "relative", width: 260, height: 260 }}>
          <video
            ref={videoRef}
            muted
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16, display: "block" }}
          />
          {/* corner guides */}
          {[["0,0","top,left"],["0,auto","top,right"],["auto,0","bottom,left"],["auto,auto","bottom,right"]].map(([pos, key]) => {
            const [t, l] = pos.split(",")
            const [vPos, hPos] = key.split(",")
            return (
              <div key={key} style={{
                position: "absolute",
                top: t === "0" ? 0 : "auto", bottom: t === "auto" ? 0 : "auto",
                left: l === "0" ? 0 : "auto", right: l === "auto" ? 0 : "auto",
                width: 28, height: 28,
                borderTop:    vPos === "top"    ? "3px solid var(--gold)" : "none",
                borderBottom: vPos === "bottom" ? "3px solid var(--gold)" : "none",
                borderLeft:   hPos === "left"   ? "3px solid var(--gold)" : "none",
                borderRight:  hPos === "right"  ? "3px solid var(--gold)" : "none",
                borderTopLeftRadius:     vPos === "top"    && hPos === "left"  ? 6 : 0,
                borderTopRightRadius:    vPos === "top"    && hPos === "right" ? 6 : 0,
                borderBottomLeftRadius:  vPos === "bottom" && hPos === "left"  ? 6 : 0,
                borderBottomRightRadius: vPos === "bottom" && hPos === "right" ? 6 : 0,
              }} />
            )
          })}
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div style={{ marginTop: 20, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
        Escaneie o QR Code de outro colecionador
      </div>
    </div>,
    document.body
  )
}
