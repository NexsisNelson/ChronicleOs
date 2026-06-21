'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { WalrusClient, WalrusObject } from '@/lib/api/walrus-client'

const client = new WalrusClient()

export default function ArtifactsPage() {
  return (
    <Suspense fallback={<div className="surface rounded-[28px] p-6 text-sm text-slate-400">Loading artifact explorer...</div>}>
      <ArtifactsPageContent />
    </Suspense>
  )
}

function ArtifactsPageContent() {
  const [cid, setCid] = useState('')
  const [metadata, setMetadata] = useState<WalrusObject | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const initialCid = searchParams.get('cid')
    if (initialCid) {
      setCid(initialCid)
      void fetchArtifact(initialCid)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Fetch metadata and text content for a Walrus object by CID.
  const fetchArtifact = async (artifactCid?: string) => {
    setError(null)
    setMetadata(null)
    setContent(null)

    const queryCid = artifactCid ?? cid
    if (!queryCid) {
      setError('Enter a Walrus CID to inspect')
      return
    }

    try {
      const meta = await client.getObjectMetadata(queryCid)
      setMetadata(meta)
      const text = await client.getTextContent(queryCid)
      setContent(text)
    } catch (err) {
      setError('Unable to load Walrus artifact. Check the CID and gateway URL.')
      console.error(err)
    }
  }

  return (
    <div className="space-y-8">
      <section className="surface rounded-[28px] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">Artifact Explorer</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Trace Walrus artifacts from CID to content.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
          Use this page to inspect stored files, verify metadata, and preview the text payload behind a Walrus content identifier.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="space-y-4">
          <div className="surface rounded-[28px] p-6">
            <h2 className="text-xl font-semibold text-white mb-3">Inspect a Walrus CID</h2>
            <label className="block text-xs uppercase tracking-[0.24em] text-slate-500 mb-2">CID</label>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400/40"
              value={cid}
              onChange={(event) => setCid(event.target.value.trim())}
              placeholder="e.g. z1A2B3C4D5E6F7G8H9I0"
            />
            <button
              type="button"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              onClick={() => void fetchArtifact()}
            >
              Load Artifact
            </button>
          </div>

          {error && (
            <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
              {error}
            </div>
          )}

          {metadata && (
            <div className="surface rounded-[28px] p-6 space-y-2">
              <h3 className="text-lg font-semibold text-white">Artifact Metadata</h3>
              <pre className="whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-200">{JSON.stringify(metadata, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="surface rounded-[28px] p-6">
          <h2 className="text-xl font-semibold text-white mb-3">Artifact Preview</h2>
          <div className="min-h-[360px] rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200">
            {content ? (
              <pre className="whitespace-pre-wrap break-words">{content}</pre>
            ) : (
              <div className="space-y-3 text-slate-500">
                <p>Enter a CID and click Load Artifact to preview a text artifact from Walrus.</p>
                <p>Use a CID from the history page after a task has completed.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
