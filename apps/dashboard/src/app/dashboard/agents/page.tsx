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
    <div className="space-y-8">
      <section className="surface rounded-[28px] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-violet-300/80">Agent Monitor</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">See the live state of ChronicleOS agents and services.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
          This page summarizes the integration health for MemWal, the active persistence layer behind agent state and workflow metadata.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.3fr,0.9fr]">
        <div className="surface rounded-[28px] p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white mb-3">Phase 2 Integration Status</h2>
          <p className="mb-6 text-sm leading-6 text-slate-400">The dashboard is wired to MemWal memory persistence for agent workflows.</p>
          <div className="grid gap-4 text-sm text-slate-200 md:grid-cols-2">
            <InfoBlock label="MemWal status" value={memwalStatus} />
            <InfoBlock label="MemWal health" value={memwalHealth ?? (loading ? 'Checking…' : 'Unknown')} />
            <InfoBlock label="Stored MemWal entries" value={loading ? 'Loading…' : memwalCount !== null ? String(memwalCount) : 'Unknown'} />
            <InfoBlock label="Walrus gateway" value={process.env.NEXT_PUBLIC_WALRUS_GATEWAY || 'Not configured'} />
          </div>
          {error && (
            <div className="mt-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
              {error}
            </div>
          )}
        </div>
        <div className="surface rounded-[28px] p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white mb-3">What Phase 2 delivers</h2>
          <ul className="space-y-3 text-sm leading-6 text-slate-300">
            <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">MemWal memory persistence for agent state</li>
            <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Walrus artifact storage with CID references</li>
            <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Shared workflow metadata across Researcher, Architect, and Auditor</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 text-sm leading-6 text-white break-words">{value}</p>
    </div>
  )
}
