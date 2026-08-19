import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en el .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const ARQUELIA_COMPANY_ID = import.meta.env.VITE_ARQUELIA_COMPANY_ID as string
export const ARQUELIA_ITEM_TYPE = 'construcciones-arquelia' as const
