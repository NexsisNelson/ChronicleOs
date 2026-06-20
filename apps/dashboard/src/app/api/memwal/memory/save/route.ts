import { NextResponse } from 'next/server'
import { saveMemoryEntry } from '@/lib/server/memwal-store'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    key?: string
    data?: Record<string, unknown>
    metadata?: Record<string, unknown>
  } | null

  if (!body?.key || !body.data) {
    return NextResponse.json({ error: 'Missing key or data' }, { status: 400 })
  }

  const entry = await saveMemoryEntry(body.key, body.data, body.metadata ?? {})
  return NextResponse.json(entry)
}
