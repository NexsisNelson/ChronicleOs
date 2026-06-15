'use client'

import { useState } from 'react'
import { MemWalClient } from '@/lib/api/memwal-client'

const client = new MemWalClient()

export default function MemoryPage() {
  const [key, setKey] = useState('')
  const [entries, setEntries] = useState<Awaited<ReturnType<MemWalClient['getMemory']>> | null>(null)
  const [keys, setKeys] = useState<string[]>([])
  const [prefix, setPrefix] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Load a single MemWal entry by key and display it in the UI.
  const loadMemory = async () => {
    setError(null)
    setEntries(null)
    if (!key) {
      setError('Enter a MemWal memory key to query')
      return
    }

    try {
      const result = await client.getMemory(key)
      setEntries(result)
      if (!result) {
        setError('No memory entry found for that key.')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to fetch MemWal entry. Check the MemWal endpoint and key.')
    }
  }

  // List MemWal keys optionally filtered by prefix to help discover stored memory entries.
  const loadKeys = async () => {
    setError(null)
    try {
      const result = await client.listMemoryKeys(prefix || undefined)
      setKeys(result)
    } catch (err) {
      console.error(err)
      setError('Failed to list MemWal keys. Check the MemWal endpoint.')
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-6">Memory Timeline</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Query MemWal Entry</h2>
            <label className="text-sm text-slate-400">Memory key</label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-blue-500"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              placeholder="e.g. research:task123"
            />
            <button
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500"
              onClick={loadMemory}
            >
              Load Entry
            </button>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">List Memory Keys</h2>
            <label className="text-sm text-slate-400">Prefix filter</label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-blue-500"
              value={prefix}
              onChange={(event) => setPrefix(event.target.value)}
              placeholder="e.g. research:"
            />
            <button
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
              onClick={loadKeys}
            >
              List Keys
            </button>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
            <h3 className="text-lg font-semibold text-white mb-3">Memory Entry</h3>
            <pre className="min-h-[200px] overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
              {entries ? JSON.stringify(entries, null, 2) : 'No memory entry loaded yet.'}
            </pre>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
            <h3 className="text-lg font-semibold text-white mb-3">Keys</h3>
            {keys.length ? (
              <ul className="space-y-2 text-sm text-slate-200">
                {keys.map((memoryKey) => (
                  <li key={memoryKey} className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                    {memoryKey}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500">No keys loaded yet. Use the prefix filter to list available MemWal keys.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
