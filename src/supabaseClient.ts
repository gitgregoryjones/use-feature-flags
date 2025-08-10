import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// HMR-safe global singleton to avoid multiple GoTrueClient instances
const GLOBAL_KEY = '__useff_supabase_singleton__';

declare global {
  // eslint-disable-next-line no-var
  var __useff_supabase_singleton__: SupabaseClient | undefined;
}

export const DEFAULT_SUPABASE_URL = 'https://khppgsehvvlukzfdqbuo.supabase.co';

export function getSupabase(): SupabaseClient {
  if (!globalThis[GLOBAL_KEY]) {
    // Prefer env vars; fallback are placeholders (replace in your app env)
    const url =
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
      DEFAULT_SUPABASE_URL;
    const anon =
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtocHBnc2VodnZsdWt6ZmRxYnVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2ODU1MzQsImV4cCI6MjA2ODI2MTUzNH0.8Z4VY4HFMm95UgO21c-DnDkbLPN_0mbDBZJPExaghDk';

    globalThis[GLOBAL_KEY] = createClient(url, anon, {
      auth: {
        // keep this lib client stateless so it doesn't step on the host app
        persistSession: false,
        autoRefreshToken: false,
        // unique key to avoid storage collisions
        storageKey: 'use-ff-auth'
      }
    });
  }
  return globalThis[GLOBAL_KEY]!;
}
