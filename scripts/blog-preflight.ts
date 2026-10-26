import { loadEnv } from 'vite'
import { createClient } from '@supabase/supabase-js'
import { blogRepository } from '../src/lib/blogRepository'

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env }
const client = createClient(env.VITE_SUPABASE_URL!, env.VITE_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
const posts = await blogRepository(client, env.VITE_ARQUELIA_COMPANY_ID!).auditAndSitemap()
console.log(`Blog: ${posts.length} artículos publicados; slugs válidos y sin duplicados.`)
