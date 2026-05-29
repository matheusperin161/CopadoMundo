"use client"

import { useState, lazy, Suspense } from "react"
import { createPortal } from "react-dom"
import { QRCodeSVG } from "qrcode.react"
import { X, ScanLine, QrCode } from "lucide-react"
import { useRouter } from "next/navigation"

const QrScannerModal = lazy(() => import("@/components/qr-scanner-modal"))

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

interface Props {
  userId: string
  userName: string
  onClose: () => void
}

export default function MyProfileSheet({ userId, userName, onClose }: Props) {
  const [showScanner, setShowScanner] = useState(false)
  const router = useRouter()

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/u/${userId}`
    : `/u/${userId}`

  const initials = userName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()

  function handleScanResult(scannedUserId: string) {
    setShowScanner(false)
    onClose()
    router.push(`/u/${scannedUserId}`)
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9998] flex items-end"
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={onClose}
      >
        <div
          className="w-full flex flex-col"
          style={{
            background: "var(--bg-card, #111827)",
            borderRadius: "24px 24px 0 0",
            borderTop: "1px solid var(--line-2, rgba(255,255,255,0.1))",
            maxHeight: "90dvh",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* drag handle */}
          <div style={{ padding: "12px 0 0", display: "flex", justifyContent: "center" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.18)" }} />
          </div>

          {/* header */}
          <div style={{ padding: "16px 20px 14px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid var(--line, rgba(255,255,255,0.07))" }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              display: "grid", placeItems: "center",
              fontWeight: 700, fontSize: 18, color: "white",
              background: avatarGradient(userId),
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink-0, #fff)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {userName}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-3, rgba(255,255,255,0.4))", marginTop: 2 }}>
                Meu perfil de trocas
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ width: 36, height: 36, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(255,255,255,0.07)", border: "none", cursor: "pointer", flexShrink: 0 }}
            >
              <X size={16} color="rgba(255,255,255,0.6)" />
            </button>
          </div>

          {/* content */}
          <div style={{ padding: "28px 20px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            {/* label */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-bebas)", fontSize: 28, letterSpacing: "0.04em", color: "var(--ink-0, #fff)", lineHeight: 1 }}>
                Meu <span style={{ color: "var(--gold)" }}>QR Code</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-3, rgba(255,255,255,0.4))", marginTop: 6 }}>
                Mostre para outra pessoa escanear e ver suas repetidas
              </div>
            </div>

            {/* QR code */}
            <div style={{
              padding: 16, borderRadius: 20,
              background: "white",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}>
              <QRCodeSVG
                value={profileUrl}
                size={200}
                bgColor="#ffffff"
                fgColor="#0a0e1a"
                level="M"
              />
            </div>

            {/* scan button */}
            <button
              onClick={() => setShowScanner(true)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "14px 28px", borderRadius: 14, width: "100%", maxWidth: 320,
                justifyContent: "center",
                background: "var(--gold)", color: "#1a1300",
                border: "none", cursor: "pointer",
                fontFamily: "inherit", fontWeight: 700, fontSize: 15,
                transition: "opacity .15s",
              }}
            >
              <ScanLine size={18} />
              Escanear QR de outro colecionador
            </button>
          </div>
        </div>
      </div>

      {showScanner && (
        <Suspense fallback={null}>
          <QrScannerModal
            onResult={handleScanResult}
            onClose={() => setShowScanner(false)}
          />
        </Suspense>
      )}
    </>,
    document.body
  )
}
