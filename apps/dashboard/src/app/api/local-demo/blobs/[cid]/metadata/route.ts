import { existsSync, statSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'
import { getDemoArtifact } from '@/lib/local-demo-data'

export async function GET(_request: Request, context: { params: Promise<{ cid: string }> }) {
  const params = await context.params
  const cid = decodeURIComponent(params.cid)
  const blobName = cid.replace(/^local:\/\//, '')
  const blobPath = join(process.cwd(), '..', 'walrus_data', 'blobs', blobName)
  const demoArtifact = getDemoArtifact(cid)

  if (existsSync(blobPath)) {
    const stat = statSync(blobPath)
    return NextResponse.json({
      cid,
      name: blobName,
      size: stat.size,
      mimeType: demoArtifact?.mimeType ?? 'application/octet-stream',
      createdAt: stat.mtime.toISOString(),
    })
  }

  if (demoArtifact) {
    return NextResponse.json({
      cid: demoArtifact.cid,
      name: demoArtifact.name,
      size: demoArtifact.size,
      mimeType: demoArtifact.mimeType,
      createdAt: demoArtifact.createdAt,
    })
  }

  return NextResponse.json({ error: 'not found' }, { status: 404 })
}
