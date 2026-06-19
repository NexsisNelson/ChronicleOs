import { readdirSync } from 'fs'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { demoMemoryEntries } from '@/lib/local-demo-data'

function getLocalMemoryKeys(): string[] {
  const storeDir = join(process.cwd(), '..', 'memwal_data')

  try {
    return readdirSync(storeDir)
      .filter((name) => name.endsWith('.json'))
      .map((name) => decodeURIComponent(name.replace(/\.json$/, '')))
  } catch {
    return demoMemoryEntries.map((entry) => entry.key)
  }
}

export async function GET(request: NextRequest) {
  const prefix = request.nextUrl.searchParams.get('prefix') ?? undefined
  const keys = getLocalMemoryKeys().filter((key) => (prefix ? key.startsWith(prefix) : true))
  return NextResponse.json(keys)
}
