import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { nodeFileTrace } from '@vercel/nft'
import ts from 'typescript'

export async function checkServerTrace() {
  // Vercel traza fuentes antes de emitir JS. tsc por sí solo no comprueba
  // que las dependencias detectadas formen parte del paquete desplegado.
  const trace = await nodeFileTrace(['api/project.ts', 'api/blog.ts'], {
    base: process.cwd(),
    readFile: async (file) => {
      try {
        const source = await readFile(file, 'utf8')
        return /\.tsx?$/.test(file) && !file.includes('node_modules') ? ts.transpileModule(source, {
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023, jsx: ts.JsxEmit.ReactJSX },
        }).outputText : source
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
        throw error
      }
    },
  })
  const traced = new Set([...trace.fileList].map((file) => file.replaceAll('\\', '/')))
  for (const required of [
    'src/components/projects/ProjectInitialContent.ts', 'src/components/blog/BlogContent.ts',
    'src/lib/projectRepository.ts', 'src/lib/projectRedirects.ts', 'src/lib/seoDocument.ts',
    'src/lib/blogRepository.ts', 'src/lib/blogCopy.ts', 'dist/index.html',
  ]) assert.ok(traced.has(required), `Vercel no incluiría ${required}: ${[...trace.warnings].map((warning) => warning.message).join('\n')}`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await checkServerTrace()
  console.log('Vercel: renderizadores, dependencias locales y HTML incluidos en la traza de ambas funciones.')
}
