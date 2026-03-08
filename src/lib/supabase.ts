import { createClient } from '@supabase/supabase-js'
import { supabaseAnonKey, supabaseUrl } from './env'

const fallbackUrl = 'http://127.0.0.1:54321'
const fallbackAnonKey = 'missing-anon-key'

export const supabase = createClient(
  supabaseUrl || fallbackUrl,
  supabaseAnonKey || fallbackAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  },
)
