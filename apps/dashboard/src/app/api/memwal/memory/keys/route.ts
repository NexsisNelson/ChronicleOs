import { NextRequest, NextResponse } from 'next/server'
import { listMemoryKeys } from '@/lib/server/memwal-store'

export async function GET(request: NextRequest) {
  const prefix = request.nextUrl.searchParams.get('prefix') ?? undefined
  return NextResponse.json(await listMemoryKeys(prefix))
}
