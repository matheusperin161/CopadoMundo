import Image from "next/image"

interface Props {
  iso: string       // ex: "br", "ar", "gb-sct"
  name: string      // alt text
  size?: number
}

export default function CountryFlag({ iso, name, size = 24 }: Props) {
  // flag-icons (lipis) supports subdivision codes like gb-sct and gb-eng
  const src = iso.includes("-")
    ? `https://flagicons.lipis.dev/flags/4x3/${iso}.svg`
    : `https://flagcdn.com/w40/${iso}.png`

  return (
    <Image
      src={src}
      alt={name}
      width={40}
      height={27}
      className="rounded-sm object-cover"
      style={{ width: size, height: "auto" }}
      unoptimized
    />
  )
}
