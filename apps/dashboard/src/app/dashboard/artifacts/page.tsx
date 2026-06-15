'use client'

import { useState } from 'react'
import { WalrusClient, WalrusObject } from '@/lib/api/walrus-client'

const client = new WalrusClient()

export default function ArtifactsPage() {
  const [cid, setCid] = useState('')
  const [metadata, setMetadata] = useState<WalrusObject | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch metadata and text content for a Walrus object by CID.
  const fetchArtifact = async () => {
    setError(null)
    setMetadata(null)
    setContent(null)

    if (!cid) {
      setError('Enter a Walrus CID to inspect')
      return
    }

    try {
      const meta = await client.getObjectMetadata(cid)
      setMetadata(meta)
      const text = await client.getTextContent(cid)
      setContent(text)
    } catch (err) {
      setError('Unable to load Walrus artifact. Check the CID and gateway URL.')
      console.error(err)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-6">Artifact Explorer</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr,2fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold text-white mb-3">Inspect a Walrus CID</h2>
            <label className="block text-sm text-slate-300 mb-2">CID</label>
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-blue-500"
              value={cid}
              onChange={(event) => setCid(event.target.value.trim())}
              placeholder="e.g. z1A2B3C4D5E6F7G8H9I0"
            />
            <button
              type="button"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500"
              onClick={fetchArtifact}
            >
              Load Artifact
            </button>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          {metadata && (
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 space-y-2">
              <h3 className="text-lg font-semibold text-white">Artifact Metadata</h3>
              <pre className="whitespace-pre-wrap break-words text-sm text-slate-200">{JSON.stringify(metadata, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white mb-3">Artifact Preview</h2>
          <div className="min-h-[320px] rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-200">
            {content ? (
              <pre className="whitespace-pre-wrap break-words">{content}</pre>
            ) : (
              <p className="text-slate-500">Enter a CID and click Load Artifact to preview a text artifact from Walrus.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
