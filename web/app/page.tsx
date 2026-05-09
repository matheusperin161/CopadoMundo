import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import HomeContent from "@/components/home-content"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect("/inicio")

  return <HomeContent />
}
