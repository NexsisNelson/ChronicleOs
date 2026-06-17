'use client'

import { useEffect, useState } from 'react'
import { MemWalClient } from '@/lib/api/memwal-client'
import { WalrusClient } from '@/lib/api/walrus-client'

export const dynamic = 'force-dynamic'

const memwalClient = new MemWalClient()
const walrusClient = new WalrusClient()

export default function DashboardHome() {
  const [memwalStatus, setMemwalStatus] = useState('Checking MemWal connection...')
  const [walrusStatus, setWalrusStatus] = useState('Checking Walrus gateway...')
  const [statusLoading, setStatusLoading] = useState(true)

  useEffect(() => {
    const loadServiceStatus = async () => {
      setStatusLoading(true)

      try {
        const memwalHealth = await memwalClient.checkHealth()
        if (memwalHealth?.status) {
          setMemwalStatus(
            memwalHealth.status.toLowerCase() === 'ok'
              ? `Healthy — ${memwalHealth.timestamp ?? 'unknown'}`
              : `Warning: ${memwalHealth.status}`
          )
        } else {
          setMemwalStatus('Unable to fetch MemWal health')
        }

        const walrusHealth = await walrusClient.checkHealth()
        if (walrusHealth?.status) {
          setWalrusStatus(
            walrusHealth.status.toLowerCase() === 'ok'
              ? `Healthy — ${walrusHealth.timestamp ?? 'unknown'}`
              : `Warning: ${walrusHealth.status}`
          )
        } else {
          setWalrusStatus('Unable to fetch Walrus health')
        }
      } catch (error) {
        console.error(error)
        setMemwalStatus('MemWal health check failed')
        setWalrusStatus('Walrus health check failed')
      } finally {
        setStatusLoading(false)
      }
    }

    loadServiceStatus()
  }, [])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Monitor your multi-agent workflows in real-time</p>
      </div>

      <div className="grid gap-6 mb-8 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Platform Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatusCard label="MemWal" status={memwalStatus} loading={statusLoading} />
            <StatusCard label="Walrus" status={walrusStatus} loading={statusLoading} />
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Live Data</h2>
          <div className="space-y-3 text-sm text-slate-300">
            <p>
              The dashboard is connected to live MemWal and Walrus endpoints, so this view stays empty until agents write real memory and artifact records.
            </p>
            <p>
              Run the agent workflow, then open the Memory, Artifact, or History pages to inspect persisted entries.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Operational Notes</h2>
        <p className="text-slate-400 text-sm">
          No fabricated session metrics are shown here. Health checks reflect the configured services only.
        </p>
      </div>
    </div>
  )
}

function StatusCard({ label, status, loading }: { label: string; status: string; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
      <p className="text-slate-400 text-sm mb-2">{label}</p>
      <p className="text-white text-sm">{loading ? 'Checking status…' : status}</p>
    </div>
  )
}
