import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    mode: 'local-demo',
    timestamp: new Date().toISOString(),
  })
}
