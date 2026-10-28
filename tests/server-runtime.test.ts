import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import { checkServerTrace } from '../scripts/check-server-trace'

test('Vercel incluye los renderizadores y las funciones arrancan en Node ESM', async () => {
  await checkServerTrace()

  const temporaryRoot = resolve('node_modules', '.tmp')
  await mkdir(temporaryRoot, { recursive: true })
  // Dentro del proyecto para que Node encuentre las dependencias de producción.
  const output = await mkdtemp(join(temporaryRoot, 'server-runtime-'))
  try {
    const compiled = spawnSync(process.execPath, [resolve('node_modules/typescript/bin/tsc'),
      '-p', 'tsconfig.runtime.json', '--noEmit', 'false', '--outDir', output, '--rootDir', process.cwd(),
    ], { encoding: 'utf8', timeout: 30000 })
    assert.equal(compiled.status, 0, compiled.error?.message || compiled.stdout + compiled.stderr)
    await writeFile(join(output, 'package.json'), '{"type":"module"}')
    const entries = ['api/project.js', 'api/blog.js'].map((path) => pathToFileURL(join(output, path)).href)
    const native = spawnSync(process.execPath, ['--input-type=module', '-e', `
      const modules = await Promise.all(${JSON.stringify(entries)}.map(url => import(url)));
      const results = [];
      for (const { default: handler } of modules) {
        const response = { statusCode: 200, setHeader() {}, end() {} };
        await handler({ method: 'POST' }, response);
        results.push({ handler: typeof handler, status: response.statusCode });
      }
      console.log(JSON.stringify(results));
    `], { encoding: 'utf8', timeout: 30000 })
    assert.equal(native.status, 0, native.error?.message || native.stdout + native.stderr)
    assert.deepEqual(JSON.parse(native.stdout.trim()), [
      { handler: 'function', status: 405 }, { handler: 'function', status: 405 },
    ])
  } finally {
    assert.equal(dirname(output), temporaryRoot)
    await rm(output, { recursive: true, force: true })
  }
})
