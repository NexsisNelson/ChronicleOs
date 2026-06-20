import { NextResponse } from 'next/server'
import { readMemoryEntry } from '@/lib/server/memwal-store'

export async function GET(_request: Request, context: { params: Promise<{ key: string }> }) {
  const params = await context.params
  const entry = await readMemoryEntry(decodeURIComponent(params.key))

  if (!entry) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  return NextResponse.json(entry)
}
