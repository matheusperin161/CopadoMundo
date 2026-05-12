const GEO_CACHE_KEY = "copado-city-cache"
const GEO_CACHE_TTL = 60 * 60 * 1000

interface CityCache {
  city: string
  lat: number
  lon: number
  ts: number
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { "Accept-Language": "pt-BR,pt", "User-Agent": "CopadoMundo/1.0" } }
    )
    if (!res.ok) return null
    const j = await res.json()
    return j.address?.city ?? j.address?.town ?? j.address?.municipality ?? j.address?.county ?? null
  } catch { return null }
}

export async function detectCity(): Promise<{ city: string; lat: number; lon: number } | null> {
  try {
    const cached = localStorage.getItem(GEO_CACHE_KEY)
    if (cached) {
      const parsed: CityCache = JSON.parse(cached)
      if (Date.now() - parsed.ts < GEO_CACHE_TTL) {
        return { city: parsed.city, lat: parsed.lat, lon: parsed.lon }
      }
    }
  } catch { /* ignore */ }

  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) { resolve(null); return }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords
        const city = await reverseGeocode(lat, lon)
        if (city) {
          try {
            const c: CityCache = { city, lat, lon, ts: Date.now() }
            localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(c))
          } catch { /* ignore */ }
          resolve({ city, lat, lon })
        } else {
          resolve(null)
        }
      },
      () => resolve(null),
      { timeout: 8000, maximumAge: 300_000 }
    )
  })
}
