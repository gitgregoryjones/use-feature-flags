import { createClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://khppgsehvvlukzfdqbuo.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtocHBnc2VodnZsdWt6ZmRxYnVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2ODU1MzQsImV4cCI6MjA2ODI2MTUzNH0.8Z4VY4HFMm95UgO21c-DnDkbLPN_0mbDBZJPExaghDk';

let _supabase: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (_supabase) return _supabase;
  _supabase = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      storageKey: 'feature-flags',
    },
  });
  return _supabase;
}
