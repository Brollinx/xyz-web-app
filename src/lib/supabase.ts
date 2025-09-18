import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config';

// Ensure environment variables are set
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Supabase URL or Anon Key is not set in src/config.ts");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);