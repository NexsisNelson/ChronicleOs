'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MemWalClient } from '@/lib/api/memwal-client'
import { demoMemoryEntries } from '@/lib/local-demo-data'

const client = new MemWalClient()

export default function MemoryPage() {
  const [key, setKey] = useState('')
  const [entries, setEntries] = useState<Awaited<ReturnType<MemWalClient['getMemory']>> | null>(null)
  const [keys, setKeys] = useState<string[]>([])
  const [prefix, setPrefix] = useState('')
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const initialKey = searchParams.get('key')
    if (initialKey) {
      setKey(initialKey)
      void loadMemory(initialKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Load a single MemWal entry by key and display it in the UI.
  const loadMemory = async (memoryKey?: string) => {
    setError(null)
    setEntries(null)
    const queryKey = memoryKey ?? key
    if (!queryKey) {
      setError('Enter a MemWal memory key to query')
      return
    }

    try {
      const result = await client.getMemory(queryKey)
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
    <div className="space-y-8">
      <section className="surface rounded-[28px] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-teal-300/80">Memory Timeline</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Inspect a specific MemWal entry or browse by prefix.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
          Use this page to query the memory store directly when you need to verify a session, inspect persisted state, or confirm that a workflow wrote the expected record.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <div className="space-y-6">
          <div className="surface rounded-[28px] p-6">
            <h2 className="text-xl font-semibold text-white mb-2">Query MemWal Entry</h2>
            <p className="text-sm text-slate-400 mb-5">Look up a single memory record by key.</p>
            <label className="text-xs uppercase tracking-[0.24em] text-slate-500">Memory key</label>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-teal-400/40"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              placeholder="e.g. research:task123"
            />
            <button
              className="mt-4 inline-flex items-center justify-center rounded-full bg-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-300"
              onClick={() => void loadMemory()}
            >
              Load Entry
            </button>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
              {demoMemoryEntries.map((entry) => (
                <Link
                  key={entry.key}
                  href={`/dashboard/memory?key=${encodeURIComponent(entry.key)}`}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 transition hover:border-teal-400/30 hover:bg-teal-400/10 hover:text-white"
                >
                  {entry.key}
                </Link>
              ))}
            </div>
          </div>

          <div className="surface rounded-[28px] p-6">
            <h2 className="text-xl font-semibold text-white mb-2">List Memory Keys</h2>
            <p className="text-sm text-slate-400 mb-5">Filter keys by prefix to discover related entries.</p>
            <label className="text-xs uppercase tracking-[0.24em] text-slate-500">Prefix filter</label>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400/40"
              value={prefix}
              onChange={(event) => setPrefix(event.target.value)}
              placeholder="e.g. research:"
            />
            <button
              className="mt-4 inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              onClick={loadKeys}
            >
              List Keys
            </button>
          </div>

          {error && (
            <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
              {error}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="surface rounded-[28px] p-6">
            <h3 className="text-lg font-semibold text-white mb-3">Memory Entry</h3>
            {entries ? (
              <pre className="min-h-[240px] overflow-x-auto whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-200">
                {JSON.stringify(entries, null, 2)}
              </pre>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-6 text-sm leading-6 text-slate-400">
                No memory entry loaded yet. Try one of the demo keys above or paste a session key from the history page.
              </div>
            )}
          </div>

          <div className="surface rounded-[28px] p-6">
            <h3 className="text-lg font-semibold text-white mb-3">Keys</h3>
            {keys.length ? (
              <ul className="space-y-2 text-sm text-slate-200">
                {keys.map((memoryKey) => (
                  <li key={memoryKey} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
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
