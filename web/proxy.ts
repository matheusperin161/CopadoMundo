import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// The Supabase library calls console.error() internally when a refresh token is
// invalid — before returning the error to our code. We handle it correctly
// (redirect + clear cookies), but the log can't be suppressed any other way.
// This module-level patch filters only the specific known-and-handled error code.
const _origError = console.error
console.error = (...args: unknown[]) => {
  if (
    args.some(
      (a) =>
        a != null &&
        typeof a === "object" &&
        (a as Record<string, unknown>).code === "refresh_token_not_found"
    )
  )
    return
  _origError(...args)
}

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

  if (isPublic) return supabaseResponse

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    // Clear all sb- cookies with explicit attributes so the browser actually removes them.
    // Using only .delete(name) without path:"/" can silently fail.
    const response = NextResponse.redirect(new URL("/login", request.url))
    const isProd = process.env.NODE_ENV === "production"
    request.cookies.getAll().forEach((c) => {
      if (c.name.startsWith("sb-")) {
        response.cookies.set(c.name, "", {
          maxAge: 0,
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: isProd,
        })
      }
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
