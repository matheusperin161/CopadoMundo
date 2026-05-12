import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function toDateStr(ts: string): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function calculateStreak(isoTimestamps: string[]): number {
  if (!isoTimestamps.length) return 0

  const dates = new Set(isoTimestamps.map(toDateStr))

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const cursor = new Date(today)
  if (!dates.has(toDateStr(cursor.toISOString()))) {
    cursor.setDate(cursor.getDate() - 1)
  }

  let streak = 0
  while (dates.has(toDateStr(cursor.toISOString()))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}
