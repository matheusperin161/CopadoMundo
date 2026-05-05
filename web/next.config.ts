import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "flagcdn.com" },
    ],
  },
}

export default nextConfig
