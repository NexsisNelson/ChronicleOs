import { existsSync, readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
export const rootDir = resolve(scriptDir, '..')
export const sampleBundlePath = resolve(rootDir, 'config', 'local-demo.sample.json')
export const dashboardBundlePath = resolve(rootDir, 'apps', 'dashboard', 'src', 'lib', 'local-demo-data.json')

export const defaultBundle = {
  preflight: {
    nodeMajor: 20,
    npmMajor: 8,
    npmMinor: 19,
    pythonMajor: 3,
    pythonMinor: 10,
  },
  bootstrap: {
    agentEnv: {
      WALRUS_ENDPOINT: '',
      MEMWAL_ENDPOINT: '',
      WALRUS_PRIVATE_KEY: '',
      MEMWAL_API_KEY: '',
      OPENAI_API_KEY: '',
      ANTHROPIC_API_KEY: '',
      DEEPSEEK_API_KEY: '',
      LOG_LEVEL: 'INFO',
      LOCAL_DEMO: '1',
    },
    dashboardEnv: {
      NEXT_PUBLIC_WALRUS_GATEWAY: 'http://localhost:3000/api/local-demo',
      NEXT_PUBLIC_MEMWAL_API: 'http://localhost:3000/api/local-demo',
      NEXT_PUBLIC_LOCAL_DEMO: '1',
    },
  },
  demo: {
    sessionId: 'demo-1',
    task: 'Produce a ChronicleOS local demo run with seeded memory and artifacts',
  },
}

function deepMerge(base, override) {
  if (override === undefined || override === null) {
    return base
  }

  if (Array.isArray(base) || Array.isArray(override)) {
    return override
  }

  if (base && typeof base === 'object' && override && typeof override === 'object') {
    const merged = { ...base }
    for (const [key, value] of Object.entries(override)) {
      merged[key] = deepMerge(base[key], value)
    }
    return merged
  }

  return override
}

export function loadLocalDemoBundle() {
  if (!existsSync(sampleBundlePath)) {
    return defaultBundle
  }

  try {
    const parsed = JSON.parse(readFileSync(sampleBundlePath, 'utf8'))
    return deepMerge(defaultBundle, parsed)
  } catch {
    return defaultBundle
  }
}
