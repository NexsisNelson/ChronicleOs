import { readFileSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'
import { getDemoArtifact } from '@/lib/local-demo-data'

function resolveBlob(cid: string) {
  const blobName = decodeURIComponent(cid).replace(/^local:\/\//, '')
  const blobPath = join(process.cwd(), '..', 'walrus_data', 'blobs', blobName)

  try {
    return readFileSync(blobPath, 'utf-8')
  } catch {
    return getDemoArtifact(`local://${blobName}`)?.content ?? null
  }
}

export async function GET(_request: Request, context: { params: Promise<{ cid: string }> }) {
  const params = await context.params
  const content = resolveBlob(params.cid)

  if (content === null) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
