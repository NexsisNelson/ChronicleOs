import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(scriptDir, '..')
const systemPython = process.platform === 'win32' ? 'python' : 'python3'
const venvPython = process.platform === 'win32'
  ? resolve(rootDir, '.venv', 'Scripts', 'python.exe')
  : resolve(rootDir, '.venv', 'bin', 'python')

function run(command, args, failureMessage) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
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

function ensureCommand(command, installHint) {
  const probe = spawnSync(command, ['--version'], {
    cwd: rootDir,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  })

  if (probe.error && probe.error.code === 'ENOENT') {
    throw new Error(installHint)
  }
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
  return `# ChronicleOS local development defaults\nWALRUS_ENDPOINT=\nMEMWAL_ENDPOINT=\nWALRUS_PRIVATE_KEY=\nMEMWAL_API_KEY=\nOPENAI_API_KEY=\nANTHROPIC_API_KEY=\nDEEPSEEK_API_KEY=\nLOG_LEVEL=INFO\nLOCAL_DEMO=1\n`
}

function dashboardEnvTemplate() {
  return `# ChronicleOS dashboard local demo defaults\nNEXT_PUBLIC_WALRUS_GATEWAY=http://localhost:3000/api/local-demo\nNEXT_PUBLIC_MEMWAL_API=http://localhost:3000/api/local-demo\nNEXT_PUBLIC_LOCAL_DEMO=1\n`
}

function main() {
  console.log('ChronicleOS bootstrap starting...')

  ensureCommand('node', 'Node.js 20+ is required. Install Node.js and rerun `npm run bootstrap`.')
  ensureCommand('npm', 'npm is required. Install Node.js 20+ and rerun `npm run bootstrap`.')
  ensureCommand(systemPython, 'Python 3.10+ is required. Install Python and rerun `npm run bootstrap`.')

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

  if (!existsSync(resolve(rootDir, '.venv'))) {
    run(systemPython, ['-m', 'venv', '.venv'], 'Failed to create the Python virtual environment. Check that Python is installed and available on PATH.')
  }

  run('npm', ['install'], 'npm install failed. Check Node.js, npm, and your network connection.')
  run(venvPython, ['-m', 'pip', 'install', '--upgrade', 'pip'], 'Failed to upgrade pip in the virtual environment.')
  run(venvPython, ['-m', 'pip', 'install', '-r', 'apps/agents/requirements-dev.txt'], 'Failed to install ChronicleOS agent dependencies.')
  run(venvPython, ['-m', 'pip', 'install', '-e', 'packages/memwal-adapter'], 'Failed to install the memwal-adapter package in editable mode.')

  console.log('Bootstrap complete.')
  console.log('Next steps:')
  console.log('  1. Run `npm run dev` to start the workspace.')
  console.log('  2. Run `npm run reset:local` to clear local demo data when needed.')
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
