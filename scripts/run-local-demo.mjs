import { spawn } from 'child_process'
import { mkdirSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const rootDir = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const pythonExe = resolve(rootDir, '.venv', 'Scripts', 'python.exe')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function run(command, args, label) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: 'inherit',
      shell: false,
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise()
      } else {
        reject(new Error(`${label} failed with exit code ${code}`))
      }
    })
  })
}

async function main() {
  const taskRequestsDir = resolve(rootDir, 'data', 'task-requests')
  mkdirSync(taskRequestsDir, { recursive: true })
  writeFileSync(resolve(taskRequestsDir, 'latest.json'), JSON.stringify({ sessionId: 'demo-1', task: 'Produce a ChronicleOS local demo run with seeded memory and artifacts' }, null, 2), 'utf8')

  await run(pythonExe, ['apps/agents/main.py', '--local-demo', '--task', 'Produce a ChronicleOS local demo run with seeded memory and artifacts', '--session-id', 'demo-1'], 'Workflow run')

  console.log('Starting the local dashboard at http://127.0.0.1:3000')
  const dashboard = spawn(npmCommand, ['--workspace=apps/dashboard', 'run', 'dev', '--', '--hostname', '127.0.0.1', '--port', '3000'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: false,
  })

  process.on('SIGINT', () => {
    dashboard.kill('SIGINT')
    process.exit(0)
  })

  dashboard.on('exit', (code) => {
    process.exit(code ?? 0)
  })
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
