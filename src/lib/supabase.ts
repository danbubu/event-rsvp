import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Server-only: service role client for API routes.
 * Env is read at call time so `next build` does not require Supabase vars during static analysis.
 */
export function getSupabaseServiceClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl?.trim()) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.")
  }
  if (!serviceRoleKey?.trim()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set. Server writes will not work.")
  }

  return createClient(supabaseUrl, serviceRoleKey)
}
