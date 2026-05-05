export type StickerType = "badge" | "player" | "team_photo" | "history"

export interface Sticker {
  id: string
  code: string
  country: string
  countryCode: string
  group: string
  number: number
  type: StickerType
}

export interface CountryInfo {
  name: string
  code: string   // FIFA code (MEX, BRA...)
  iso: string    // ISO 3166-1 alpha-2 (mx, br...) — usado para imagem da bandeira
  group: string
  flag: string   // emoji (fallback)
}

export const GROUPS: Record<string, CountryInfo[]> = {
  A: [
    { name: "México",           code: "MEX", iso: "mx", group: "A", flag: "🇲🇽" },
    { name: "África do Sul",    code: "RSA", iso: "za", group: "A", flag: "🇿🇦" },
    { name: "Coreia do Sul",    code: "KOR", iso: "kr", group: "A", flag: "🇰🇷" },
    { name: "República Tcheca", code: "CZE", iso: "cz", group: "A", flag: "🇨🇿" },
  ],
  B: [
    { name: "Canadá",            code: "CAN", iso: "ca", group: "B", flag: "🇨🇦" },
    { name: "Catar",             code: "QAT", iso: "qa", group: "B", flag: "🇶🇦" },
    { name: "Bósnia-Herzegovina",code: "BIH", iso: "ba", group: "B", flag: "🇧🇦" },
    { name: "Suíça",             code: "SUI", iso: "ch", group: "B", flag: "🇨🇭" },
  ],
  C: [
    { name: "Brasil",   code: "BRA", iso: "br", group: "C", flag: "🇧🇷" },
    { name: "Escócia",  code: "SCO", iso: "gb-sct", group: "C", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
    { name: "Haiti",    code: "HAI", iso: "ht", group: "C", flag: "🇭🇹" },
    { name: "Marrocos", code: "MAR", iso: "ma", group: "C", flag: "🇲🇦" },
  ],
  D: [
    { name: "Turquia",        code: "TUR", iso: "tr", group: "D", flag: "🇹🇷" },
    { name: "Austrália",      code: "AUS", iso: "au", group: "D", flag: "🇦🇺" },
    { name: "Paraguai",       code: "PAR", iso: "py", group: "D", flag: "🇵🇾" },
    { name: "Estados Unidos", code: "USA", iso: "us", group: "D", flag: "🇺🇸" },
  ],
  E: [
    { name: "Equador",         code: "ECU", iso: "ec", group: "E", flag: "🇪🇨" },
    { name: "Costa do Marfim", code: "CIV", iso: "ci", group: "E", flag: "🇨🇮" },
    { name: "Curaçao",         code: "CUW", iso: "cw", group: "E", flag: "🇨🇼" },
    { name: "Alemanha",        code: "GER", iso: "de", group: "E", flag: "🇩🇪" },
  ],
  F: [
    { name: "Holanda",  code: "NED", iso: "nl", group: "F", flag: "🇳🇱" },
    { name: "Tunísia",  code: "TUN", iso: "tn", group: "F", flag: "🇹🇳" },
    { name: "Suécia",   code: "SWE", iso: "se", group: "F", flag: "🇸🇪" },
    { name: "Japão",    code: "JPN", iso: "jp", group: "F", flag: "🇯🇵" },
  ],
  G: [
    { name: "Nova Zelândia", code: "NZL", iso: "nz", group: "G", flag: "🇳🇿" },
    { name: "Irã",           code: "IRN", iso: "ir", group: "G", flag: "🇮🇷" },
    { name: "Egito",         code: "EGY", iso: "eg", group: "G", flag: "🇪🇬" },
    { name: "Bélgica",       code: "BEL", iso: "be", group: "G", flag: "🇧🇪" },
  ],
  H: [
    { name: "Uruguai",       code: "URU", iso: "uy", group: "H", flag: "🇺🇾" },
    { name: "Arábia Saudita",code: "KSA", iso: "sa", group: "H", flag: "🇸🇦" },
    { name: "Cabo Verde",    code: "CPV", iso: "cv", group: "H", flag: "🇨🇻" },
    { name: "Espanha",       code: "ESP", iso: "es", group: "H", flag: "🇪🇸" },
  ],
  I: [
    { name: "Noruega", code: "NOR", iso: "no", group: "I", flag: "🇳🇴" },
    { name: "Iraque",  code: "IRQ", iso: "iq", group: "I", flag: "🇮🇶" },
    { name: "Senegal", code: "SEN", iso: "sn", group: "I", flag: "🇸🇳" },
    { name: "França",  code: "FRA", iso: "fr", group: "I", flag: "🇫🇷" },
  ],
  J: [
    { name: "Jordânia",  code: "JOR", iso: "jo", group: "J", flag: "🇯🇴" },
    { name: "Áustria",   code: "AUT", iso: "at", group: "J", flag: "🇦🇹" },
    { name: "Argélia",   code: "ALG", iso: "dz", group: "J", flag: "🇩🇿" },
    { name: "Argentina", code: "ARG", iso: "ar", group: "J", flag: "🇦🇷" },
  ],
  K: [
    { name: "Colômbia",    code: "COL", iso: "co", group: "K", flag: "🇨🇴" },
    { name: "Uzbequistão", code: "UZB", iso: "uz", group: "K", flag: "🇺🇿" },
    { name: "Congo RD",    code: "COD", iso: "cd", group: "K", flag: "🇨🇩" },
    { name: "Portugal",    code: "POR", iso: "pt", group: "K", flag: "🇵🇹" },
  ],
  L: [
    { name: "Panamá",     code: "PAN", iso: "pa", group: "L", flag: "🇵🇦" },
    { name: "Gana",       code: "GHA", iso: "gh", group: "L", flag: "🇬🇭" },
    { name: "Croácia",    code: "CRO", iso: "hr", group: "L", flag: "🇭🇷" },
    { name: "Inglaterra", code: "ENG", iso: "gb-eng", group: "L", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  ],
}

function getStickerType(number: number): StickerType {
  if (number === 1) return "badge"
  if (number === 13) return "team_photo"
  return "player"
}

function generateStickers(): Sticker[] {
  const stickers: Sticker[] = []

  // FWC History stickers
  for (let i = 1; i <= 25; i++) {
    stickers.push({
      id: `FWC${i}`,
      code: `FWC ${i}`,
      country: "FIFA World Cup History",
      countryCode: "FWC",
      group: "FWC",
      number: i,
      type: "history",
    })
  }

  // Country stickers
  for (const [group, countries] of Object.entries(GROUPS)) {
    for (const country of countries) {
      for (let num = 1; num <= 20; num++) {
        stickers.push({
          id: `${country.code}${num}`,
          code: `${country.code} ${num}`,
          country: country.name,
          countryCode: country.code,
          group,
          number: num,
          type: getStickerType(num),
        })
      }
    }
  }

  return stickers
}

export const ALL_STICKERS: Sticker[] = generateStickers()

export const STICKERS_BY_COUNTRY: Record<string, Sticker[]> = ALL_STICKERS.reduce(
  (acc, sticker) => {
    if (!acc[sticker.countryCode]) acc[sticker.countryCode] = []
    acc[sticker.countryCode].push(sticker)
    return acc
  },
  {} as Record<string, Sticker[]>
)

export const STICKERS_BY_GROUP: Record<string, Sticker[]> = ALL_STICKERS.reduce(
  (acc, sticker) => {
    if (!acc[sticker.group]) acc[sticker.group] = []
    acc[sticker.group].push(sticker)
    return acc
  },
  {} as Record<string, Sticker[]>
)

export const TOTAL_STICKERS = ALL_STICKERS.length

export function getStickerById(id: string): Sticker | undefined {
  return ALL_STICKERS.find((s) => s.id === id)
}

export function getCountryInfo(code: string): CountryInfo | undefined {
  for (const countries of Object.values(GROUPS)) {
    const found = countries.find((c) => c.code === code)
    if (found) return found
  }
  return undefined
}

export const ALL_COUNTRIES: CountryInfo[] = Object.values(GROUPS).flat()

// Map: countryCode → flag emoji (inclui FWC e CC)
export const FLAG_MAP: Record<string, string> = {
  FWC: "🏆",
  CC: "🥤",
  ...Object.fromEntries(ALL_COUNTRIES.map((c) => [c.code, c.flag])),
}
