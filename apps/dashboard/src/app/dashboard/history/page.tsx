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
    <div className="space-y-8">
      <section className="surface rounded-[28px] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-amber-300/80">Execution History</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Review persisted MemWal entries in chronological order.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
          This view surfaces the memory history produced by the agent workflow so you can inspect what changed, when it changed, and which agent wrote it.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="surface rounded-[28px] p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white mb-4">Recent MemWal Entries</h2>
          {loading ? (
            <p className="text-slate-400">Loading history…</p>
          ) : error ? (
            <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
              {error}
            </div>
          ) : entries.length === 0 ? (
            <p className="text-slate-400">No MemWal entries found yet.</p>
          ) : (
            <ul className="space-y-4">
              {entries.map((entry) => (
                <li key={entry.key ?? Math.random()} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Key</p>
                      <p className="mt-2 break-all text-white">{entry.key}</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Timestamp</p>
                      <p className="mt-2 text-white">{entry.timestamp ?? 'unknown'}</p>
                    </div>
                  </div>
                  {entry.agent && (
                    <p className="mt-3 text-sm text-slate-300">Agent: {entry.agent}</p>
                  )}
                  {entry.data && (
                    <pre className="mt-3 max-h-44 overflow-auto rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-xs text-slate-200">
                      {JSON.stringify(entry.data, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="surface rounded-[28px] p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white mb-3">Phase 2 Timeline</h2>
          <p className="text-sm leading-6 text-slate-400 mb-4">
            This page shows the MemWal-backed workflow entries that capture agent decisions and persisted state.
          </p>
          <div className="space-y-3 text-sm text-slate-200">
            <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              A connected MemWal instance lets the Researcher, Architect, and Auditor share verified memory across runs.
            </p>
            <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              If no entries appear, run the agent workflow and refresh this page to see the persisted memory entries.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
