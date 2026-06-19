import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..', '..')
const dataPath = resolve(rootDir, 'apps', 'dashboard', 'src', 'lib', 'local-demo-data.json')

test('dashboard local demo bundle seeds the expected session', () => {
  const bundle = JSON.parse(readFileSync(dataPath, 'utf8'))

  assert.equal(bundle.demoSessionId, 'demo-1')
  assert.equal(bundle.demoTask, 'Produce a ChronicleOS local demo run with seeded memory and artifacts')
  assert.equal(bundle.demoMemoryEntries.length, 4)
  assert.equal(bundle.demoArtifacts.length, 2)
  assert.equal(bundle.demoMemoryEntries[0].key, 'research:demo-1')
  assert.equal(bundle.demoMemoryEntries[1].key, 'architect:demo-1')
  assert.equal(bundle.demoMemoryEntries[2].key, 'audit:demo-1')
  assert.equal(bundle.demoMemoryEntries[3].key, 'workflow:demo-1:checkpoint')
  assert.equal(bundle.demoArtifacts[0].cid, 'local://research_summary.md')
  assert.equal(bundle.demoArtifacts[1].cid, 'local://data_export.json')
})
