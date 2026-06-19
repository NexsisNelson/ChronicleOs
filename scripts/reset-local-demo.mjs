import { existsSync, readdirSync, rmSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(scriptDir, '..')

function cleanDirectoryContents(directoryPath) {
  if (!existsSync(directoryPath)) {
    return 0
  }

  let removed = 0
  for (const entry of readdirSync(directoryPath)) {
    rmSync(resolve(directoryPath, entry), { recursive: true, force: true })
    removed += 1
  }
  return removed
}

const targets = [
  resolve(rootDir, 'memwal_data'),
  resolve(rootDir, 'walrus_data', 'blobs'),
  resolve(rootDir, 'apps', 'agents', 'artifacts'),
  resolve(rootDir, 'apps', 'agents', 'data'),
  resolve(rootDir, 'apps', 'agents', 'logs'),
  resolve(rootDir, 'apps', 'dashboard', '.next'),
]

console.log('Resetting ChronicleOS local demo data...')
for (const target of targets) {
  const removed = cleanDirectoryContents(target)
  if (removed > 0) {
    console.log(`Cleared ${removed} item(s) from ${target}`)
  }
}
console.log('Local demo reset complete.')
