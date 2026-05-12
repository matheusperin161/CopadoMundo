import { cache } from "react"
import { createClient } from "./server"

export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const getUserProfile = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", userId)
    .single()
  return data
})

export const getUserCollection = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("user_collection")
    .select("sticker_id")
    .eq("user_id", userId)
  return data ?? []
})

export const getUserDuplicates = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("user_duplicates")
    .select("sticker_id, quantity")
    .eq("user_id", userId)
  return data ?? []
})

export const getUserCollectionDates = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("user_collection")
    .select("created_at")
    .eq("user_id", userId)
    .not("created_at", "is", null)
  return (data ?? []).map((r) => r.created_at as string)
})

// Minimal fields used by the nav badges in layout
export const getOpenTrades = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("trades")
    .select("wanting_sticker_id, offering_sticker_id")
    .eq("status", "open")
    .neq("user_id", userId)
  return data ?? []
})
