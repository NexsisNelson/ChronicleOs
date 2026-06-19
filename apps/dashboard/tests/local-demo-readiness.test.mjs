import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..', '..')
const sampleBundlePath = resolve(rootDir, 'config', 'local-demo.sample.json')
const dashboardBundlePath = resolve(rootDir, 'apps', 'dashboard', 'src', 'lib', 'local-demo-data.json')
const healthRoutePath = resolve(rootDir, 'apps', 'dashboard', 'src', 'app', 'api', 'local-demo', 'health', 'route.ts')
const memoryKeysRoutePath = resolve(rootDir, 'apps', 'dashboard', 'src', 'app', 'api', 'local-demo', 'memory', 'keys', 'route.ts')
const artifactMetadataRoutePath = resolve(rootDir, 'apps', 'dashboard', 'src', 'app', 'api', 'local-demo', 'blobs', '[cid]', 'metadata', 'route.ts')

test('sample bundle and dashboard seed data stay aligned', () => {
  const sampleBundle = JSON.parse(readFileSync(sampleBundlePath, 'utf8'))
  const dashboardBundle = JSON.parse(readFileSync(dashboardBundlePath, 'utf8'))

  assert.equal(sampleBundle.demo.sessionId, dashboardBundle.demoSessionId)
  assert.equal(sampleBundle.demo.task, dashboardBundle.demoTask)
  assert.equal(sampleBundle.bootstrap.dashboardEnv.NEXT_PUBLIC_LOCAL_DEMO, '1')
  assert.equal(dashboardBundle.demoMemoryEntries[0].key, `research:${sampleBundle.demo.sessionId}`)
  assert.equal(dashboardBundle.demoArtifacts[0].cid, 'local://research_summary.md')
})

test('local demo health route advertises local demo mode', () => {
  const routeSource = readFileSync(healthRoutePath, 'utf8')

  assert.match(routeSource, /mode:\s*'local-demo'/)
  assert.match(routeSource, /timestamp:\s*new Date\(\)\.toISOString\(\)/)
})

test('local demo memory and artifact routes fall back to seeded data', () => {
  const memoryKeysSource = readFileSync(memoryKeysRoutePath, 'utf8')
  const artifactMetadataSource = readFileSync(artifactMetadataRoutePath, 'utf8')

  assert.match(memoryKeysSource, /demoMemoryEntries/)
  assert.match(memoryKeysSource, /getLocalMemoryKeys/)
  assert.match(artifactMetadataSource, /getDemoArtifact/)
  assert.match(artifactMetadataSource, /mimeType:/)
})