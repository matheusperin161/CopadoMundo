import Image from "next/image"

interface Props {
  iso: string       // ex: "br", "ar", "gb-sct"
  name: string      // alt text
  size?: number
}

export default function CountryFlag({ iso, name, size = 24 }: Props) {
  // flagcdn.com suporta códigos ISO como "br", "ar", "gb" etc.
  // Para subdivisões (gb-sct, gb-eng) usamos o código principal
  const code = iso.includes("-") ? iso.split("-")[0] : iso

  return (
    <Image
      src={`https://flagcdn.com/w40/${code}.png`}
      alt={name}
      width={size}
      height={Math.round(size * 0.67)}
      className="rounded-sm object-cover"
      style={{ width: size, height: "auto" }}
      unoptimized
    />
  )
}
