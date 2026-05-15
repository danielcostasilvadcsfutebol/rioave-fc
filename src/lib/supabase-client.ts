import { createClient } from '@supabase/supabase-js';

// Fallback para build time — os valores reais vêm das env vars em runtime
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key-for-build';

export const supabase = createClient(url, key);
