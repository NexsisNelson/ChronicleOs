import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { spawnSync } from 'child_process'
import { get } from 'http'
import { dashboardBundlePath, loadLocalDemoBundle, rootDir } from './local-demo-bundle.mjs'

const pythonExecutable = process.platform === 'win32'
  ? resolve(rootDir, '.venv', 'Scripts', 'python.exe')
  : resolve(rootDir, '.venv', 'bin', 'python')
const npmCommand = process.platform === 'win32' ? 'cmd' : 'npm'
const npmArgs = process.platform === 'win32' ? ['/c', 'npm', '--version'] : ['--version']

function parseVersion(text) {
  const match = text.match(/(\d+)\.(\d+)\.(\d+)/)
  return match ? { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) } : null
}

function ensureVersion(command, args, label, minimumMajor, minimumMinor) {
  const result = spawnSync(command, args, { cwd: rootDir, encoding: 'utf8', shell: false })
  const version = parseVersion(`${result.stdout ?? ''}${result.stderr ?? ''}`)
  if (!version) {
    throw new Error(`Unable to read ${label} version`)
  }
  if (version.major < minimumMajor || (version.major === minimumMajor && version.minor < minimumMinor)) {
    throw new Error(`${label} ${minimumMajor}.${minimumMinor}+ is required, but ${version.major}.${version.minor}.${version.patch} was found.`)
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function requestJson(url) {
  return new Promise((resolvePromise, rejectPromise) => {
    get(url, (response) => {
      const chunks = []
      response.on('data', (chunk) => chunks.push(chunk))
      response.on('end', () => {
        try {
          const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'))
          resolvePromise({ statusCode: response.statusCode ?? 0, payload })
        } catch (error) {
          rejectPromise(error)
        }
      })
    }).on('error', rejectPromise)
  })
}

async function main() {
  console.log('Verifying ChronicleOS local demo readiness...')

  const bundle = loadLocalDemoBundle()
  const preflight = bundle.preflight ?? {}

  ensureVersion('node', ['--version'], 'Node.js', preflight.nodeMajor ?? 20, 0)
  ensureVersion(npmCommand, npmArgs, 'npm', preflight.npmMajor ?? 8, preflight.npmMinor ?? 19)
  ensureVersion(process.platform === 'win32' ? 'python' : 'python3', ['--version'], 'Python', preflight.pythonMajor ?? 3, preflight.pythonMinor ?? 10)

  if (!existsSync(dashboardBundlePath)) {
    throw new Error('Missing apps/dashboard/src/lib/local-demo-data.json')
  }

  const dashboardData = readJson(dashboardBundlePath)

  if (dashboardData.demoSessionId !== bundle.demo.sessionId) {
    throw new Error('Dashboard demo session does not match the shared sample bundle')
  }

  if (dashboardData.demoTask !== bundle.demo.task) {
    throw new Error('Dashboard demo task does not match the shared sample bundle')
  }

  if (!existsSync(resolve(rootDir, 'apps', 'agents', '.env'))) {
    throw new Error('apps/agents/.env is missing. Run npm run bootstrap first.')
  }

  if (!existsSync(resolve(rootDir, 'apps', 'dashboard', '.env.local'))) {
    throw new Error('apps/dashboard/.env.local is missing. Run npm run bootstrap first.')
  }

  const dashboardHealth = await requestJson('http://localhost:3000/api/health').catch(() => null)
  const localDemoHealth = await requestJson('http://localhost:3000/api/local-demo/health').catch(() => null)

  assert(dashboardHealth?.statusCode === 200, 'Dashboard health endpoint is not ready')
  assert(localDemoHealth?.statusCode === 200, 'Local demo health endpoint is not ready')

  const researchKey = `research:${bundle.demo.sessionId}`
  const memoryKeys = await requestJson('http://localhost:3000/api/local-demo/memory/keys?prefix=research%3A')
  assert(Array.isArray(memoryKeys?.payload), 'Local demo memory key endpoint did not return a key list')
  assert(memoryKeys.payload.includes(researchKey), 'Local demo memory keys do not include the seeded research entry')

  const memoryEntry = await requestJson(`http://localhost:3000/api/local-demo/memory/${encodeURIComponent(researchKey)}`)
  assert(memoryEntry?.statusCode === 200, 'Local demo memory entry endpoint is not ready')
  assert(memoryEntry?.payload?.key === researchKey, 'Local demo memory entry does not match the seeded research key')

  const artifactMetadata = await requestJson(`http://localhost:3000/api/local-demo/blobs/${encodeURIComponent('local://research_summary.md')}/metadata`)
  assert(artifactMetadata?.statusCode === 200, 'Local demo artifact metadata endpoint is not ready')
  assert(artifactMetadata?.payload?.cid === 'local://research_summary.md', 'Local demo artifact metadata does not match the seeded research artifact')

  const statusResult = spawnSync(pythonExecutable, ['apps/agents/main.py', '--status'], {
    cwd: rootDir,
    encoding: 'utf8',
  })

  if (statusResult.status !== 0) {
    throw new Error(statusResult.stderr || statusResult.stdout || 'Agent status command failed')
  }

  if (!/dashboard/i.test(statusResult.stdout) || !/seeded demo data/i.test(statusResult.stdout)) {
    throw new Error('Agent status output did not summarize dashboard and seeded demo readiness')
  }

  const readyResult = spawnSync(pythonExecutable, ['apps/agents/main.py', '--ready', '--local-demo'], {
    cwd: rootDir,
    encoding: 'utf8',
  })

  if (readyResult.status !== 0) {
    throw new Error(readyResult.stderr || readyResult.stdout || 'Agent ready command failed')
  }

  if (!/ChronicleOS readiness/i.test(readyResult.stdout) || !/Seeded demo/i.test(readyResult.stdout)) {
    throw new Error('Agent ready output did not summarize services and seeded demo readiness')
  }

  console.log('Local demo bundle session:', dashboardData.demoSessionId)
  console.log('Local demo task:', dashboardData.demoTask)
  console.log(`Dashboard health: ${dashboardHealth?.statusCode === 200 ? 'ready' : 'not ready'}`)
  console.log(`Local demo health: ${localDemoHealth?.statusCode === 200 ? 'ready' : 'not ready'}`)
  console.log('Seeded memory key:', researchKey)
  console.log('Seeded artifact:', 'local://research_summary.md')
  console.log('Agent status: ready')
  console.log('Verification complete.')
}

try {
  await main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
