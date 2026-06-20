import { NextResponse } from 'next/server'
import { getMemWalHealth } from '@/lib/server/memwal-store'

export async function GET() {
  return NextResponse.json(await getMemWalHealth())
}
