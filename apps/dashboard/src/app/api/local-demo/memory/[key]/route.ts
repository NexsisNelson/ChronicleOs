import { readFileSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'
import { getDemoMemoryEntry } from '@/lib/local-demo-data'

function readLocalMemory(key: string) {
  const storeDir = join(process.cwd(), '..', 'memwal_data')
  const encodedKey = `${encodeURIComponent(key)}.json`
  const filePath = join(storeDir, encodedKey)

  try {
    const raw = readFileSync(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return getDemoMemoryEntry(key)
  }
}

export async function GET(_request: Request, context: { params: Promise<{ key: string }> }) {
  const params = await context.params
  const key = decodeURIComponent(params.key)
  const entry = readLocalMemory(key)

  if (!entry) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  return NextResponse.json(entry)
}
