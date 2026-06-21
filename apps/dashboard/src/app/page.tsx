import Link from 'next/link'
import { ArrowRight, Clock, FileStack, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-dark via-slate-900 to-slate-800">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <h1 className="text-xl font-bold text-white">ChronicleOS</h1>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold text-white mb-6">
            Inspect your live agent workflow in real time.
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            ChronicleOS shows submitted tasks, persisted memory, and stored artifacts from the running workflow.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition"
          >
            Open Dashboard <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <FeatureCard
            icon={<Clock className="w-6 h-6" />}
            title="Memory Timeline"
            description="Open the persisted memory timeline and follow real workflow state as it appears."
          />
          <FeatureCard
            icon={<FileStack className="w-6 h-6" />}
            title="Artifact Explorer"
            description="Browse the artifact explorer to inspect live Walrus-backed outputs."
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Live Agent Monitor"
            description="Check readiness, then monitor the agents and services from one place."
          />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard/memory"
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-center"
          >
            View Memory Timeline
          </Link>
          <Link
            href="/dashboard/artifacts"
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-center"
          >
            Browse Artifacts
          </Link>
          <Link
            href="/dashboard/agents"
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-center"
          >
            Monitor Agents
          </Link>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm hover:border-slate-600/50 hover:bg-slate-800/50 transition">
      <div className="text-blue-400 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-300 text-sm">{description}</p>
    </div>
  )
}
