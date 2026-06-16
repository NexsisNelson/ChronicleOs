'use client'

import { useEffect, useState } from 'react'
import { MemWalClient } from '@/lib/api/memwal-client'

const client = new MemWalClient()

export default function AgentsPage() {
  const [loading, setLoading] = useState(true)
  const [memwalStatus, setMemwalStatus] = useState('Checking MemWal connection...')
  const [memwalHealth, setMemwalHealth] = useState<string | null>(null)
  const [memwalCount, setMemwalCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStatus = async () => {
      setLoading(true)
      setError(null)

      try {
        const health = await client.checkHealth()
        if (health?.status?.toLowerCase() === 'ok') {
          setMemwalStatus('Connected to MemWal')
          setMemwalHealth(`Healthy — ${health.timestamp ?? 'unknown'}`)
        } else if (health) {
          setMemwalStatus(`MemWal responded: ${health.status}`)
          setMemwalHealth(`Timestamp: ${health.timestamp ?? 'unknown'}`)
        } else {
          setMemwalStatus('MemWal connection failed')
          setMemwalHealth('No health response')
        }

        const keys = await client.listMemoryKeys()
        setMemwalCount(keys.length)
      } catch (err) {
        console.error(err)
        setError('Unable to reach MemWal endpoint. Check dashboard configuration and CORS settings.')
        setMemwalStatus('MemWal connection failed')
        setMemwalHealth('No health response')
      } finally {
        setLoading(false)
      }
    }

    loadStatus()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-6">Agent Monitor</h1>
      <div className="grid gap-6 lg:grid-cols-[1.3fr,0.9fr]">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white mb-3">Phase 2 Integration Status</h2>
          <p className="text-slate-400 mb-4">The dashboard is now wired to MemWal memory persistence for agent workflows.</p>
          <div className="space-y-4 text-sm text-slate-200">
            <div>
              <p className="text-slate-400">MemWal status</p>
              <p className="mt-1 text-white">{memwalStatus}</p>
            </div>
            <div>
              <p className="text-slate-400">MemWal health</p>
              <p className="mt-1 text-white">{memwalHealth ?? (loading ? 'Checking…' : 'Unknown')}</p>
            </div>
            <div>
              <p className="text-slate-400">Stored MemWal entries</p>
              <p className="mt-1 text-white">{loading ? 'Loading…' : memwalCount !== null ? memwalCount : 'Unknown'}</p>
            </div>
            <div>
              <p className="text-slate-400">Walrus gateway</p>
              <p className="mt-1 text-white">{process.env.NEXT_PUBLIC_WALRUS_GATEWAY || 'Not configured'}</p>
            </div>
          </div>
          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white mb-3">What Phase 2 delivers</h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-200 text-sm">
            <li>MemWal memory persistence for agent state</li>
            <li>Walrus artifact storage with CID references</li>
            <li>Shared workflow metadata across Researcher / Architect / Auditor</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
