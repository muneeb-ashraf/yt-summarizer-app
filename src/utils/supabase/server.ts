import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Standard client for Server Components, etc.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            await cookieStore.set({ name, value, ...options })
          } catch (_error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            await cookieStore.set({ name, value: '', ...options })
          } catch (_error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// New client specifically for Route Handlers
export async function createRouteHandlerClient() {
  const cookieStore = await cookies() // Await cookies() first

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) { // Make async
          // Now that cookieStore is resolved, this should be safe
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) { // Make async
          // Now that cookieStore is resolved, this should be safe
          await cookieStore.set({ name, value, ...options }) // Add await
        },
        async remove(name: string, options: CookieOptions) { // Make async
          // Now that cookieStore is resolved, this should be safe
          await cookieStore.set({ name, value: '', ...options }) // Add await
        },
      },
    }
  )
} 