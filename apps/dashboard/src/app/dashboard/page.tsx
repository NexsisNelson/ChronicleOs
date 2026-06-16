'use client'

import { useEffect, useState } from 'react'
import { MemWalClient } from '@/lib/api/memwal-client'
import { WalrusClient } from '@/lib/api/walrus-client'

const memwalClient = new MemWalClient()
const walrusClient = new WalrusClient()

const getProgressWidthClass = (progress: number) => {
  if (progress >= 100) return 'w-full'
  if (progress >= 90) return 'w-[90%]'
  if (progress >= 80) return 'w-[80%]'
  if (progress >= 70) return 'w-[70%]'
  if (progress >= 60) return 'w-[60%]'
  if (progress >= 50) return 'w-[50%]'
  if (progress >= 40) return 'w-[40%]'
  if (progress >= 30) return 'w-[30%]'
  if (progress >= 20) return 'w-[20%]'
  if (progress >= 10) return 'w-[10%]'
  return 'w-[5%]'
}

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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Monitor your multi-agent workflows in real-time</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Agents" value="3" icon="🤖" />
        <StatCard label="Sessions Today" value="12" icon="📊" />
        <StatCard label="Artifacts Generated" value="847" icon="📄" />
        <StatCard label="Avg Quality Score" value="94%" icon="⭐" />
      </div>

      {/* Current Session */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Current Session</h2>
        <div className="space-y-4">
          <div>
            <p className="text-slate-400 text-sm">Task</p>
            <p className="text-white font-semibold">Generate comprehensive market analysis report on AI infrastructure</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-white">Running</p>
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Started</p>
              <p className="text-white">2 hours ago</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Progress</p>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-1">
                <div className="bg-blue-500 h-2 rounded-full w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Health */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Platform Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatusCard label="MemWal" status={memwalStatus} loading={statusLoading} />
          <StatusCard label="Walrus" status={walrusStatus} loading={statusLoading} />
        </div>
      </div>

      {/* Agent Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AgentStatusCard
          name="Researcher"
          status="running"
          task="Gathering data from 42 sources..."
          progress={75}
        />
        <AgentStatusCard
          name="Architect"
          status="waiting"
          task="Waiting for research phase to complete"
          progress={0}
        />
        <AgentStatusCard
          name="Auditor"
          status="idle"
          task="Ready to review artifacts"
          progress={0}
        />
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
      <p className="text-slate-400 text-sm mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-white">{value}</p>
        <span className="text-2xl">{icon}</span>
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

function AgentStatusCard({
  name,
  status,
  task,
  progress,
}: {
  name: string
  status: 'idle' | 'running' | 'waiting' | 'error'
  task: string
  progress: number
}) {
  const statusColor = {
    idle: 'bg-gray-500',
    running: 'bg-green-500',
    waiting: 'bg-yellow-500',
    error: 'bg-red-500',
  }[status]

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{name}</h3>
        <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
      </div>
      <p className="text-slate-400 text-sm mb-4">{task}</p>
      {progress > 0 && (
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className={`bg-blue-500 h-2 rounded-full transition-all ${getProgressWidthClass(progress)}`}
          ></div>
        </div>
      )}
    </div>
  )
}
