export type StickerType = "badge" | "player" | "team_photo" | "history" | "sponsor"

export interface Sticker {
  id: string
  code: string
  country: string
  countryCode: string
  group: string
  number: number
  type: StickerType
  playerName?: string
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
    { name: "México",           code: "MEX", iso: "mx",     group: "A", flag: "🇲🇽" },
    { name: "África do Sul",    code: "RSA", iso: "za",     group: "A", flag: "🇿🇦" },
    { name: "Coreia do Sul",    code: "KOR", iso: "kr",     group: "A", flag: "🇰🇷" },
    { name: "República Tcheca", code: "CZE", iso: "cz",     group: "A", flag: "🇨🇿" },
  ],
  B: [
    { name: "Canadá",             code: "CAN", iso: "ca", group: "B", flag: "🇨🇦" },
    { name: "Bósnia-Herzegovina", code: "BIH", iso: "ba", group: "B", flag: "🇧🇦" },
    { name: "Catar",              code: "QAT", iso: "qa", group: "B", flag: "🇶🇦" },
    { name: "Suíça",              code: "SUI", iso: "ch", group: "B", flag: "🇨🇭" },
  ],
  C: [
    { name: "Brasil",   code: "BRA", iso: "br",     group: "C", flag: "🇧🇷" },
    { name: "Marrocos", code: "MAR", iso: "ma",     group: "C", flag: "🇲🇦" },
    { name: "Haiti",    code: "HAI", iso: "ht",     group: "C", flag: "🇭🇹" },
    { name: "Escócia",  code: "SCO", iso: "gb-sct", group: "C", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  ],
  D: [
    { name: "Estados Unidos", code: "USA", iso: "us", group: "D", flag: "🇺🇸" },
    { name: "Paraguai",       code: "PAR", iso: "py", group: "D", flag: "🇵🇾" },
    { name: "Austrália",      code: "AUS", iso: "au", group: "D", flag: "🇦🇺" },
    { name: "Turquia",        code: "TUR", iso: "tr", group: "D", flag: "🇹🇷" },
  ],
  E: [
    { name: "Alemanha",        code: "GER", iso: "de", group: "E", flag: "🇩🇪" },
    { name: "Curaçao",         code: "CUW", iso: "cw", group: "E", flag: "🇨🇼" },
    { name: "Costa do Marfim", code: "CIV", iso: "ci", group: "E", flag: "🇨🇮" },
    { name: "Equador",         code: "ECU", iso: "ec", group: "E", flag: "🇪🇨" },
  ],
  F: [
    { name: "Holanda", code: "NED", iso: "nl", group: "F", flag: "🇳🇱" },
    { name: "Japão",   code: "JPN", iso: "jp", group: "F", flag: "🇯🇵" },
    { name: "Suécia",  code: "SWE", iso: "se", group: "F", flag: "🇸🇪" },
    { name: "Tunísia", code: "TUN", iso: "tn", group: "F", flag: "🇹🇳" },
  ],
  G: [
    { name: "Bélgica", code: "BEL", iso: "be", group: "G", flag: "🇧🇪" },
    { name: "Egito",   code: "EGY", iso: "eg", group: "G", flag: "🇪🇬" },
    { name: "Irã",     code: "IRN", iso: "ir", group: "G", flag: "🇮🇷" },
    { name: "Espanha", code: "ESP", iso: "es", group: "G", flag: "🇪🇸" },
  ],
  H: [
    { name: "Nova Zelândia",  code: "NZL", iso: "nz", group: "H", flag: "🇳🇿" },
    { name: "Cabo Verde",     code: "CPV", iso: "cv", group: "H", flag: "🇨🇻" },
    { name: "Arábia Saudita", code: "KSA", iso: "sa", group: "H", flag: "🇸🇦" },
    { name: "Uruguai",        code: "URU", iso: "uy", group: "H", flag: "🇺🇾" },
  ],
  I: [
    { name: "França",  code: "FRA", iso: "fr", group: "I", flag: "🇫🇷" },
    { name: "Senegal", code: "SEN", iso: "sn", group: "I", flag: "🇸🇳" },
    { name: "Iraque",  code: "IRQ", iso: "iq", group: "I", flag: "🇮🇶" },
    { name: "Noruega", code: "NOR", iso: "no", group: "I", flag: "🇳🇴" },
  ],
  J: [
    { name: "Argentina", code: "ARG", iso: "ar", group: "J", flag: "🇦🇷" },
    { name: "Argélia",   code: "ALG", iso: "dz", group: "J", flag: "🇩🇿" },
    { name: "Áustria",   code: "AUT", iso: "at", group: "J", flag: "🇦🇹" },
    { name: "Jordânia",  code: "JOR", iso: "jo", group: "J", flag: "🇯🇴" },
  ],
  K: [
    { name: "Portugal",    code: "POR", iso: "pt", group: "K", flag: "🇵🇹" },
    { name: "Congo RD",    code: "COD", iso: "cd", group: "K", flag: "🇨🇩" },
    { name: "Uzbequistão", code: "UZB", iso: "uz", group: "K", flag: "🇺🇿" },
    { name: "Colômbia",    code: "COL", iso: "co", group: "K", flag: "🇨🇴" },
  ],
  L: [
    { name: "Inglaterra", code: "ENG", iso: "gb-eng", group: "L", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { name: "Croácia",    code: "CRO", iso: "hr",     group: "L", flag: "🇭🇷" },
    { name: "Gana",       code: "GHA", iso: "gh",     group: "L", flag: "🇬🇭" },
    { name: "Panamá",     code: "PAN", iso: "pa",     group: "L", flag: "🇵🇦" },
  ],
}

function getStickerType(number: number): StickerType {
  if (number === 1)  return "badge"
  if (number === 13) return "team_photo"
  return "player"
}

const CC_PLAYERS: { number: number; playerName: string; countryCode: string }[] = [
  { number: 1,  playerName: "Harry Kane",        countryCode: "ENG" },
  { number: 2,  playerName: "Kylian Mbappé",     countryCode: "FRA" },
  { number: 3,  playerName: "Vinícius Jr.",       countryCode: "BRA" },
  { number: 4,  playerName: "Lamine Yamal",       countryCode: "ESP" },
  { number: 5,  playerName: "Joshua Kimmich",     countryCode: "GER" },
  { number: 6,  playerName: "Erling Haaland",     countryCode: "NOR" },
  { number: 7,  playerName: "Federico Valverde",  countryCode: "URU" },
  { number: 8,  playerName: "Enner Valencia",     countryCode: "ECU" },
  { number: 9,  playerName: "Jefferson Lerma",    countryCode: "COL" },
  { number: 10, playerName: "Virgil van Dijk",    countryCode: "NED" },
  { number: 11, playerName: "Alphonse Davies",    countryCode: "CAN" },
  { number: 12, playerName: "Pedri González",     countryCode: "ESP" },
  { number: 13, playerName: "Gabriel Magalhães",  countryCode: "BRA" },
  { number: 14, playerName: "Santiago Giménez",   countryCode: "MEX" },
]

function generateStickers(): Sticker[] {
  const stickers: Sticker[] = []

  // FWC History stickers (0–19)
  for (let i = 0; i <= 19; i++) {
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

  // Coca-Cola Star Players (CC1–CC14)
  for (const p of CC_PLAYERS) {
    stickers.push({
      id: `CC${p.number}`,
      code: `CC ${p.number}`,
      country: "Coca-Cola Stars",
      countryCode: "CC",
      group: "CC",
      number: p.number,
      type: "sponsor",
      playerName: p.playerName,
    })
  }

  // Country stickers (1–20 each)
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

// Country color palettes for gradient sticker cards
const COUNTRY_COLORS: Record<string, [string, string, string?]> = {
  FWC: ["#1a1300", "#3d2e00", "#FFD23F"],
  CC:  ["#c8000a", "#ff1a1a", "#ffffff"],
  MEX: ["#006847", "#ffffff", "#ce1126"],
  RSA: ["#007a4d", "#ffb612", "#002395"],
  KOR: ["#003478", "#cd2e3a", "#ffffff"],
  CZE: ["#d7141a", "#ffffff", "#11457e"],
  CAN: ["#ff0000", "#ffffff"],
  QAT: ["#8d1b3d", "#ffffff"],
  BIH: ["#002395", "#fecb00", "#ffffff"],
  SUI: ["#ff0000", "#ffffff"],
  BRA: ["#009c3b", "#ffdf00", "#002776"],
  SCO: ["#003da5", "#ffffff"],
  HAI: ["#00209f", "#d21034"],
  MAR: ["#c1272d", "#006233"],
  TUR: ["#e30a17", "#ffffff"],
  AUS: ["#002868", "#cc0000", "#ffffff"],
  PAR: ["#d52b1e", "#ffffff", "#0038a8"],
  USA: ["#3c3b6e", "#b22234", "#ffffff"],
  ECU: ["#ffd100", "#0072ce", "#ed1c24"],
  CIV: ["#f77f00", "#ffffff", "#009a44"],
  CUW: ["#002b7f", "#009fca", "#f9e814"],
  GER: ["#000000", "#dd0000", "#ffce00"],
  NED: ["#ae1c28", "#ffffff", "#21468b"],
  TUN: ["#e70013", "#ffffff"],
  SWE: ["#006aa7", "#fecc02"],
  JPN: ["#bc002d", "#ffffff"],
  NZL: ["#00247d", "#cc0001", "#ffffff"],
  IRN: ["#239f40", "#ffffff", "#da0000"],
  EGY: ["#ce1126", "#ffffff", "#000000"],
  BEL: ["#000000", "#fae042", "#ed2939"],
  URU: ["#0038a8", "#ffffff", "#fcd116"],
  KSA: ["#006c35", "#ffffff"],
  CPV: ["#003893", "#cf2027", "#f7d116"],
  ESP: ["#aa151b", "#f1bf00"],
  NOR: ["#ef2b2d", "#ffffff", "#002868"],
  IRQ: ["#000000", "#ce1126", "#ffffff"],
  SEN: ["#00853f", "#fdef42", "#e31b23"],
  FRA: ["#0055a4", "#ffffff", "#ef4135"],
  JOR: ["#007a3d", "#000000", "#ffffff"],
  AUT: ["#ed2939", "#ffffff"],
  ALG: ["#006233", "#d21034", "#ffffff"],
  ARG: ["#74acdf", "#ffffff", "#f6b40e"],
  COL: ["#fcd116", "#003893", "#ce1126"],
  UZB: ["#1eb53a", "#ffffff", "#ce1126"],
  COD: ["#007fff", "#f7d618", "#ce1126"],
  POR: ["#006600", "#ff0000", "#ffd700"],
  PAN: ["#da121a", "#ffffff", "#00386a"],
  GHA: ["#006b3f", "#fcd116", "#ce1126"],
  CRO: ["#ff0000", "#ffffff", "#171796"],
  ENG: ["#cf081f", "#ffffff"],
}

export function countryGradient(code: string): string {
  const colors = COUNTRY_COLORS[code]
  if (!colors) return "linear-gradient(135deg, #1f2a4d 0%, #141a30 100%)"
  const [c1, c2, c3] = colors
  if (!c3) return `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`
  return `linear-gradient(135deg, ${c1} 0%, ${c2} 50%, ${c3} 100%)`
}
