import type { Metadata, Viewport } from "next"
import { Bebas_Neue, DM_Sans } from "next/font/google"
import Script from "next/script"
import { Toaster } from "@/components/ui/sonner"
import PWARegister from "@/components/pwa-register"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas",
  subsets: ["latin"],
})

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Copa 2026 — Álbum de Figurinhas",
  description: "Gerencie sua coleção de figurinhas da Copa do Mundo 2026. Cadastre suas figurinhas, repetidas e troque com outros colecionadores.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo_sem_fundo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Copa 2026",
  },
  openGraph: {
    title: "Copa 2026 — Álbum de Figurinhas",
    description: "Gerencie sua coleção de figurinhas da Copa do Mundo 2026",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: "#0A1628",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${bebasNeue.variable} ${dmSans.variable} h-full`} suppressHydrationWarning>
      <body className={`min-h-full antialiased ${dmSans.className}`} suppressHydrationWarning>
        <Script id="theme-init" strategy="beforeInteractive">{`(function(){try{var t=localStorage.getItem('copa-theme')||'dark';document.documentElement.classList.add(t)}catch(e){}})()`}</Script>
        <ThemeProvider>
          <PWARegister />
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
