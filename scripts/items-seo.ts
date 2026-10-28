import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve, relative, dirname, isAbsolute } from 'node:path'
import { loadEnv } from 'vite'
import { createClient } from '@supabase/supabase-js'
import { ARQUELIA_ITEM_TYPE, projectRepository } from '../src/lib/projectRepository'
import { auditProjects, prepareSeoSql, type PublicItemsExport, type SeoProposal } from './items-seo-core'

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env }
const args = process.argv.slice(2)
const option = (name: string) => { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1] }
async function save(path: string, content: string) {
  const destination = resolve(path)
  const offset = relative(process.cwd(), destination)
  if (offset.startsWith('..') || isAbsolute(offset)) throw new Error('El archivo de salida debe permanecer en este proyecto')
  await mkdir(dirname(destination), { recursive: true })
  await writeFile(destination, content, { flag: 'wx' })
  console.log(`Guardado: ${offset}`)
}

if (args[0] === 'prepare') {
  const exportPath = option('--export')
  const proposalsPath = option('--proposals')
  const output = option('--output')
  if (!exportPath || !proposalsPath || !output) throw new Error('Uso: npm run items-seo:prepare -- --export archivo.json --proposals revisadas.json --output lote.sql')
  const snapshot = JSON.parse(await readFile(exportPath, 'utf8')) as PublicItemsExport
  const proposals = JSON.parse(await readFile(proposalsPath, 'utf8')) as SeoProposal[]
  await save(output, prepareSeoSql(snapshot, proposals, env.VITE_ARQUELIA_COMPANY_ID!))
  console.log('SQL preparado; NO se ha conectado ni escrito en Supabase.')
} else {
  // Acceso público exclusivamente al tenant configurado y tipo de Arquelia.
  const client = createClient(env.VITE_SUPABASE_URL!, env.VITE_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
  const repository = projectRepository(client, env.VITE_ARQUELIA_COMPANY_ID!)
  const projects = []
  for (let page = 1; ; page++) {
    const result = await repository.list(page)
    projects.push(...result.projects)
    if (!result.hasMore) break
  }
  const snapshot: PublicItemsExport = { company_id: env.VITE_ARQUELIA_COMPANY_ID!, item_type: ARQUELIA_ITEM_TYPE, exported_at: new Date().toISOString(), projects }
  const audit = { company_id: snapshot.company_id, item_type: snapshot.item_type, count: projects.length,
    cross_type_collisions: 'Verificar con ITEMS_SEO_PREFLIGHT.sql en el panel; este script no lee otros tipos ni estados.', findings: auditProjects(projects) }
  console.log(JSON.stringify(audit, null, 2))
  const exportPath = option('--export')
  if (exportPath) await save(exportPath, JSON.stringify(snapshot, null, 2) + '\n')
  if (audit.findings.some((row) => row.issues.length)) process.exitCode = 1
}
