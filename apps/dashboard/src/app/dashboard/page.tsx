'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Activity, CheckCircle2, Database, Layers3, MessageSquarePlus, ShieldCheck, Sparkles } from 'lucide-react'
import { MemWalClient } from '@/lib/api/memwal-client'
import { WalrusClient } from '@/lib/api/walrus-client'

export const dynamic = 'force-dynamic'

const memwalClient = new MemWalClient()
const walrusClient = new WalrusClient()

export default function DashboardHome() {
  const [memwalStatus, setMemwalStatus] = useState('Checking MemWal connection...')
  const [walrusStatus, setWalrusStatus] = useState('Checking Walrus aggregator...')
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
    <div className="space-y-8">
      <section className="surface rounded-[28px] p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr] lg:items-end">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/25 bg-teal-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-teal-200">
              <Sparkles className="h-3.5 w-3.5" /> Live control surface
            </div>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                See the agent system as a live operational command center.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                ChronicleOS connects MemWal and Walrus so you can inspect workflows, artifacts, and memory state as they change.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Focus</p>
                <p className="mt-1 text-sm text-white">Memory, artifacts, and execution history</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Scope</p>
                <p className="mt-1 text-sm text-white">Researcher, Architect, Auditor</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/memory"
                className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                Open memory timeline
              </Link>
              <Link
                href="/dashboard/tasks"
                className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Launch a task
              </Link>
              <Link
                href="/dashboard/history"
                className="inline-flex items-center rounded-full border border-teal-400/30 bg-teal-400/10 px-4 py-2 text-sm text-teal-100 transition hover:bg-teal-400/20"
              >
                Open run history
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <MetricCard icon={Activity} label="System health" value={statusLoading ? 'Checking…' : 'Live'} detail="MemWal and Walrus endpoints" />
            <MetricCard icon={Database} label="Storage layer" value="2 services" detail="Verifiable memory + artifact storage" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="surface rounded-[28px] p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-teal-300/80">Platform Health</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Connected services</h2>
            </div>
            <ShieldCheck className="h-6 w-6 text-teal-300" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <StatusCard label="MemWal" status={memwalStatus} loading={statusLoading} tone="teal" />
            <StatusCard label="Walrus" status={walrusStatus} loading={statusLoading} tone="blue" />
          </div>
        </div>

        <div className="surface rounded-[28px] p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <Layers3 className="h-6 w-6 text-cyan-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Live Data</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">What to do next</h2>
            </div>
          </div>
          <div className="space-y-4 text-sm leading-6 text-slate-300">
            <p>
              Start the agent workflow, then inspect Memory, Artifact, and History to see real persisted records appear.
            </p>
            <p>
              The dashboard shows live endpoint state only. It does not invent sessions or metrics when no workflow has run.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <QuickLink href="/dashboard/memory" label="Open memory" />
            <QuickLink href="/dashboard/artifacts" label="Browse artifacts" />
            <QuickLink href="/dashboard/history" label="View history" />
          </div>
        </div>
      </section>

      <section className="surface rounded-[28px] p-6 sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-teal-300" />
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-teal-300/80">Quick checklist</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">What to do next</h2>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChecklistItem
            title="1. Bootstrap the workspace"
            description="Run the single bootstrap command to create env files and install dependencies."
            href="/docs/START_HERE.md"
            actionLabel="Open setup guide"
          />
          <ChecklistItem
            title="2. Launch a real task"
            description="Use the Task Launcher to submit a workflow that will persist real memory and artifact results."
            href={`/dashboard/history`}
            actionLabel="Open history"
          />
          <ChecklistItem
            title="3. Run a real workflow"
            description="Launch the agents with a task, then inspect the memory and artifact entries that are written."
            href="/dashboard/memory"
            actionLabel="Open memory timeline"
          />
          <ChecklistItem
            title="4. Follow the persisted links"
            description="Use the run history to jump directly from a workflow key to its memory and artifact records."
            href="/dashboard/history"
            actionLabel="Open history"
          />
        </div>
      </section>

      <section className="surface rounded-[28px] p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <MessageSquarePlus className="h-5 w-5 text-teal-300" />
          <h2 className="text-2xl font-semibold text-white">Operational notes</h2>
        </div>
        <p className="max-w-3xl text-sm leading-6 text-slate-400">
          ChronicleOS is optimized for inspection rather than synthetic demos, but the fastest way to start a run is the new Task Launcher: write a task once, copy the command, and launch the workflow from the same screen.
        </p>
      </section>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-teal-300">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  )
}

function StatusCard({ label, status, loading, tone }: { label: string; status: string; loading: boolean; tone: 'teal' | 'blue' }) {
  const accent = tone === 'teal' ? 'text-teal-300' : 'text-sky-300'
  const border = tone === 'teal' ? 'border-teal-400/20' : 'border-sky-400/20'
  const bg = tone === 'teal' ? 'bg-teal-400/10' : 'bg-sky-400/10'

  return (
    <div className={`rounded-3xl border ${border} ${bg} p-5`}>
      <p className={`text-xs uppercase tracking-[0.24em] ${accent}`}>{label}</p>
      <p className="mt-3 text-sm leading-6 text-white">{loading ? 'Checking status…' : status}</p>
    </div>
  )
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-teal-400/30 hover:bg-teal-400/10 hover:text-white"
    >
      {label}
    </a>
  )
}

function ChecklistItem({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string
  description: string
  href: string
  actionLabel: string
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center rounded-full border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-slate-200 transition hover:border-teal-400/30 hover:bg-teal-400/10 hover:text-white"
      >
        {actionLabel}
      </Link>
    </div>
  )
}
