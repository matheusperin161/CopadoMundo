import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname
  const isPublic = pathname === "/login" || pathname.startsWith("/auth/")

  // Skip auth check entirely for public routes to avoid logging token errors
  if (isPublic) return supabaseResponse

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    const response = NextResponse.redirect(new URL("/login", request.url))
    request.cookies.getAll().forEach((c) => {
      if (c.name.startsWith("sb-")) response.cookies.delete(c.name)
    })
    return response
  }

  const protectedPaths = ["/inicio", "/colecao", "/repetidas", "/trocas", "/chat"]
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
