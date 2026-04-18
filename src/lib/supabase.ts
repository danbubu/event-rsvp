import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser-safe singleton
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client (uses service role — never exposed to browser)
export function getSupabaseServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set. Server writes will not work.")
  }

  return createClient(supabaseUrl, serviceRoleKey)
}
