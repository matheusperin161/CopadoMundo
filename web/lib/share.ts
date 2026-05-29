export function shareViaWhatsApp(text: string) {
  if (typeof navigator !== "undefined" && "share" in navigator) {
    navigator.share({ text }).catch(() => {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
    })
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
  }
}
