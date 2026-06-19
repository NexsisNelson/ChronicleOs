import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { spawnSync } from 'child_process'
import { dashboardBundlePath, loadLocalDemoBundle, rootDir } from './local-demo-bundle.mjs'

const localDemoDataPath = resolve(rootDir, 'apps', 'dashboard', 'src', 'lib', 'local-demo-data.json')
const systemPython = process.platform === 'win32' ? 'python' : 'python3'
const npmInstallCommand = process.platform === 'win32' ? 'cmd' : 'npm'
const npmInstallArgs = process.platform === 'win32' ? ['/c', 'npm', 'install'] : ['install']
const npmProbeCommand = process.platform === 'win32' ? 'cmd' : 'npm'
const npmProbeArgs = process.platform === 'win32' ? ['/c', 'npm', '--version'] : ['--version']
const venvPython = process.platform === 'win32'
  ? resolve(rootDir, '.venv', 'Scripts', 'python.exe')
  : resolve(rootDir, '.venv', 'bin', 'python')

function run(command, args, failureMessage) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: false,
  })

  if (result.error) {
    if (result.error.code === 'ENOENT') {
      throw new Error(failureMessage)
    }
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(failureMessage)
  }
}

function ensureCommandVersion(command, args, label, minimum, installHint) {
  const probe = spawnSync(command, args, {
    cwd: rootDir,
    encoding: 'utf8',
    shell: false,
  })

  if (probe.error && probe.error.code === 'ENOENT') {
    throw new Error(installHint)
  }

  if (probe.status !== 0) {
    throw new Error(`Unable to run ${label} for the bootstrap preflight.`)
  }

  const output = `${probe.stdout ?? ''}${probe.stderr ?? ''}`
  const version = parseVersion(output)
  if (!version) {
    throw new Error(`Unable to determine ${label} version from: ${output.trim()}`)
  }

  if (version.major < minimum.major || (version.major === minimum.major && version.minor < minimum.minor)) {
    throw new Error(`${label} ${minimum.major}.${minimum.minor}+ is required, but ${version.major}.${version.minor}.${version.patch} was found.`)
  }

  return version
}

function parseVersion(versionText) {
  const match = versionText.match(/(\d+)\.(\d+)\.(\d+)/)
  if (!match) {
    return null
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  }
}

function ensureMinimumVersion(command, minimum, label) {
  const probe = spawnSync(command, ['--version'], {
    cwd: rootDir,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })

  const output = `${probe.stdout ?? ''}${probe.stderr ?? ''}`
  const version = parseVersion(output)
  if (!version) {
    throw new Error(`Unable to determine ${label} version. Output was: ${output.trim()}`)
  }

  if (version.major < minimum.major || (version.major === minimum.major && version.minor < minimum.minor)) {
    throw new Error(`${label} ${minimum.major}.${minimum.minor}+ is required, but ${version.major}.${version.minor}.${version.patch} was found.`)
  }
}

function loadSampleBundle() {
  return loadLocalDemoBundle()
}

function ensureFile(filePath, content) {
  if (existsSync(filePath)) {
    return false
  }

  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, content, 'utf8')
  return true
}

function ensureDirectory(directoryPath) {
  mkdirSync(directoryPath, { recursive: true })
}

function envTemplate() {
  const bundle = loadSampleBundle()
  const values = bundle?.bootstrap?.agentEnv ?? {
    WALRUS_ENDPOINT: '',
    MEMWAL_ENDPOINT: '',
    WALRUS_PRIVATE_KEY: '',
    MEMWAL_API_KEY: '',
    OPENAI_API_KEY: '',
    ANTHROPIC_API_KEY: '',
    DEEPSEEK_API_KEY: '',
    LOG_LEVEL: 'INFO',
    LOCAL_DEMO: '1',
  }

  return Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n'
}

function dashboardEnvTemplate() {
  const bundle = loadSampleBundle()
  const values = bundle?.bootstrap?.dashboardEnv ?? {
    NEXT_PUBLIC_WALRUS_GATEWAY: 'http://localhost:3000/api/local-demo',
    NEXT_PUBLIC_MEMWAL_API: 'http://localhost:3000/api/local-demo',
    NEXT_PUBLIC_LOCAL_DEMO: '1',
  }

  return Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n'
}

function seedLocalDemoFiles() {
  if (!existsSync(localDemoDataPath)) {
    return
  }

  const bundle = JSON.parse(readFileSync(localDemoDataPath, 'utf8'))
  const memwalDir = resolve(rootDir, 'memwal_data')
  const walrusDir = resolve(rootDir, 'walrus_data', 'blobs')

  ensureDirectory(memwalDir)
  ensureDirectory(walrusDir)

  for (const entry of bundle.demoMemoryEntries ?? []) {
    const filePath = resolve(memwalDir, `${entry.key}.json`.replaceAll(':', '%3A'))
    if (!existsSync(filePath)) {
      writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf8')
    }
  }

  for (const artifact of bundle.demoArtifacts ?? []) {
    const blobName = artifact.cid.replace('local://', '')
    const blobPath = resolve(walrusDir, blobName)
    const metadataPath = resolve(walrusDir, `${blobName}.meta.json`)
    if (!existsSync(blobPath)) {
      writeFileSync(blobPath, artifact.content, 'utf8')
    }
    if (!existsSync(metadataPath)) {
      writeFileSync(metadataPath, JSON.stringify({
        cid: artifact.cid,
        name: artifact.name,
        size: artifact.size,
        mimeType: artifact.mimeType,
        createdAt: artifact.createdAt,
      }, null, 2), 'utf8')
    }
  }
}

function main() {
  console.log('ChronicleOS bootstrap starting...')

  const bundle = loadSampleBundle()
  const preflight = bundle.preflight ?? {}
  const nodeVersion = ensureCommandVersion('node', ['--version'], 'Node.js', { major: preflight.nodeMajor ?? 20, minor: 0 }, 'Node.js is required. Install Node.js and rerun `npm run bootstrap`.')
  const npmVersion = ensureCommandVersion(npmProbeCommand, npmProbeArgs, 'npm', { major: preflight.npmMajor ?? 8, minor: preflight.npmMinor ?? 19 }, 'npm is required. Install Node.js and rerun `npm run bootstrap`.')
  const pythonVersion = ensureCommandVersion(systemPython, ['--version'], 'Python', { major: preflight.pythonMajor ?? 3, minor: preflight.pythonMinor ?? 10 }, 'Python is required. Install Python and rerun `npm run bootstrap`.')

  console.log(`Preflight checks passed: Node.js ${nodeVersion.major}.${nodeVersion.minor}.${nodeVersion.patch}, npm ${npmVersion.major}.${npmVersion.minor}.${npmVersion.patch}, Python ${pythonVersion.major}.${pythonVersion.minor}.${pythonVersion.patch}`)
  if (!existsSync(dashboardBundlePath)) {
    console.log('Using fallback local demo bundle until dashboard sample data is available.')
  }

  const createdAgentEnv = ensureFile(resolve(rootDir, 'apps', 'agents', '.env'), envTemplate())
  const createdDashboardEnv = ensureFile(resolve(rootDir, 'apps', 'dashboard', '.env.local'), dashboardEnvTemplate())

  ensureDirectory(resolve(rootDir, 'memwal_data'))
  ensureDirectory(resolve(rootDir, 'walrus_data', 'blobs'))
  ensureDirectory(resolve(rootDir, 'apps', 'agents', 'artifacts'))
  ensureDirectory(resolve(rootDir, 'apps', 'agents', 'data'))
  ensureDirectory(resolve(rootDir, 'apps', 'agents', 'logs'))

  if (createdAgentEnv) {
    console.log('Created apps/agents/.env with safe local defaults.')
  }
  if (createdDashboardEnv) {
    console.log('Created apps/dashboard/.env.local with local demo endpoints.')
  }

  seedLocalDemoFiles()

  if (!existsSync(resolve(rootDir, '.venv'))) {
    run(systemPython, ['-m', 'venv', '.venv'], 'Failed to create the Python virtual environment. Check that Python is installed and available on PATH.')
  }

  run(npmInstallCommand, npmInstallArgs, 'npm install failed. Check Node.js, npm, and your network connection.')
  run(venvPython, ['-m', 'pip', 'install', '--upgrade', 'pip'], 'Failed to upgrade pip in the virtual environment.')
  run(venvPython, ['-m', 'pip', 'install', '-r', 'apps/agents/requirements-dev.txt'], 'Failed to install ChronicleOS agent dependencies.')
  run(venvPython, ['-m', 'pip', 'install', '-e', 'packages/memwal-adapter'], 'Failed to install the memwal-adapter package in editable mode.')

  console.log('Bootstrap complete.')
  console.log('Next steps:')
  console.log('  1. Run `npm run dev` to start the workspace.')
  console.log('  2. Run `npm run ready` to confirm dashboard, agent, and local demo readiness.')
  console.log('  3. Run `npm run reset:local` to clear local demo data when needed.')
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
