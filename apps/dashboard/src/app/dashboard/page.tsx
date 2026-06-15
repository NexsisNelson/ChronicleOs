'use client'

export default function DashboardHome() {
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
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
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
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  )
}
