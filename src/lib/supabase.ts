import { createClient } from "@supabase/supabase-js";

// Browser client — uses anon key, RLS enforced
// Lazily evaluated so the build doesn't crash if env vars are missing
export function supabase() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.");
  return createClient(url, anon);
}

// Server client — uses service role key, bypasses RLS (API routes only)
export function supabaseAdmin() {
  const url         = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) throw new Error("Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  return createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
