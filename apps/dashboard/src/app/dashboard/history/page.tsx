'use client'

import { useEffect, useState } from 'react'
import { MemWalClient } from '@/lib/api/memwal-client'

const client = new MemWalClient()

type MemoryEntry = {
  key: string
  timestamp?: string
  agent?: string
  data?: Record<string, unknown>
  proof?: string
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<MemoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true)
      setError(null)

      try {
        const fetchedKeys = await client.listMemoryKeys()

        const fetchedEntries: MemoryEntry[] = await Promise.all(
          fetchedKeys.slice(0, 50).map(async (key) => {
            const entry = await client.getMemory(key)
            return entry ? { ...entry, key } : { key }
          })
        )

        const sortedEntries = fetchedEntries.sort((a, b) => {
            const aTime = a.timestamp ? Date.parse(a.timestamp) : 0
            const bTime = b.timestamp ? Date.parse(b.timestamp) : 0
            return bTime - aTime
          })

        setEntries(sortedEntries)
      } catch (err) {
        console.error(err)
        setError('Unable to load execution history from MemWal. Check the MemWal endpoint and network settings.')
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-6">Execution History</h1>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent MemWal Entries</h2>
          {loading ? (
            <p className="text-slate-400">Loading history…</p>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : entries.length === 0 ? (
            <p className="text-slate-400">No MemWal entries found yet.</p>
          ) : (
            <ul className="space-y-4">
              {entries.map((entry) => (
                <li key={entry.key ?? Math.random()} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-400">Key</p>
                      <p className="text-white break-all">{entry.key}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">Timestamp</p>
                      <p className="text-white">{entry.timestamp ?? 'unknown'}</p>
                    </div>
                  </div>
                  {entry.agent && (
                    <p className="mt-3 text-sm text-slate-200">Agent: {entry.agent}</p>
                  )}
                  {entry.data && (
                    <pre className="mt-3 max-h-44 overflow-auto rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-200">
                      {JSON.stringify(entry.data, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white mb-3">Phase 2 Timeline</h2>
          <p className="text-slate-400 text-sm mb-4">
            This page shows the MemWal-backed workflow entries that capture agent decisions and persisted state.
          </p>
          <div className="space-y-3 text-sm text-slate-200">
            <p>
              A connected MemWal instance allows the Researcher, Architect, and Auditor agents to share verified memory and artifact metadata across runs.
            </p>
            <p>
              If no entries appear, run the agent workflow and refresh this page to see the persisted memory entries.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
