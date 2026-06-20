'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, Download, Sparkles, TerminalSquare, WandSparkles } from 'lucide-react'

const defaultTask = 'Research the latest ChronicleOS workflow improvements and summarize the best next step for users.'
const defaultSessionId = 'task-1'

function escapePowerShellArgument(value: string) {
  return `"${value.replaceAll('"', '`"')}"`
}

function escapeBashArgument(value: string) {
  return `"${value.replaceAll('"', '\\"')}"`
}

export default function TaskLauncherPage() {
  const [task, setTask] = useState(defaultTask)
  const [sessionId, setSessionId] = useState(defaultSessionId)
  const [copied, setCopied] = useState<'powershell' | 'bash' | 'task' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [running, setRunning] = useState(false)
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null)
  const [runMessage, setRunMessage] = useState<string | null>(null)
  const [taskFilePath, setTaskFilePath] = useState<string | null>(null)

  const taskFileContent = useMemo(() => task.trim() || defaultTask, [task])
  const powerShellCommand = useMemo(
    () => `..\\.venv\\Scripts\\python.exe apps\\agents\\main.py --task ${escapePowerShellArgument(taskFileContent)} --session-id ${escapePowerShellArgument(sessionId || defaultSessionId)}`,
    [sessionId, taskFileContent]
  )
  const bashCommand = useMemo(
    () => `./.venv/bin/python apps/agents/main.py --task ${escapeBashArgument(taskFileContent)} --session-id ${escapeBashArgument(sessionId || defaultSessionId)}`,
    [sessionId, taskFileContent]
  )

  const submissionPowerShellCommand = useMemo(() => {
    if (!taskFilePath) {
      return ''
    }

    return `..\\.venv\\Scripts\\python.exe apps\\agents\\main.py --task-file ${escapePowerShellArgument(taskFilePath)} --session-id ${escapePowerShellArgument(sessionId || defaultSessionId)}`
  }, [sessionId, taskFilePath])

  const submissionBashCommand = useMemo(() => {
    if (!taskFilePath) {
      return ''
    }

    return `./.venv/bin/python apps/agents/main.py --task-file ${escapeBashArgument(taskFilePath)} --session-id ${escapeBashArgument(sessionId || defaultSessionId)}`
  }, [sessionId, taskFilePath])

  const copyText = async (value: string, channel: 'powershell' | 'bash' | 'task') => {
    await navigator.clipboard.writeText(value)
    setCopied(channel)
    window.setTimeout(() => setCopied(null), 1500)
  }

  const downloadTaskFile = () => {
    const blob = new Blob([`${taskFileContent}\n`], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${sessionId || defaultSessionId}.task.txt`
    link.click()
    URL.revokeObjectURL(url)
    setCopied('task')
    window.setTimeout(() => setCopied(null), 1500)
  }

  const submitTask = async () => {
    setSubmitting(true)
    setSubmissionMessage(null)
    setTaskFilePath(null)

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: taskFileContent,
          sessionId,
        }),
      })

      const payload = (await response.json()) as {
        error?: string
        taskFilePath?: string
        sessionId?: string
      }

      if (!response.ok) {
        throw new Error(payload.error ?? 'Task submission failed.')
      }

      setTaskFilePath(payload.taskFilePath ?? null)
      setSubmissionMessage(`Submitted as ${payload.sessionId ?? sessionId}. The task file is ready to run from the dashboard.`)
      return payload.sessionId ?? sessionId
    } catch (error) {
      setSubmissionMessage(error instanceof Error ? error.message : 'Task submission failed.')
      return null
    } finally {
      setSubmitting(false)
    }
  }

  const runLatestSubmittedTask = async (submittedSessionId?: string) => {
    setRunning(true)
    setRunMessage(null)

    try {
      const response = await fetch('/api/tasks/run-latest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: submittedSessionId,
        }),
      })

      const payload = (await response.json()) as {
        error?: string
        command?: string
        pid?: number
        sessionId?: string
      }

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to launch the latest submitted task.')
      }

      setRunMessage(`Running ${payload.sessionId ?? submittedSessionId ?? sessionId} in the background as PID ${payload.pid ?? 'unknown'}.`)
    } catch (error) {
      setRunMessage(error instanceof Error ? error.message : 'Failed to launch the latest submitted task.')
    } finally {
      setRunning(false)
    }
  }

  const submitAndRunTask = async () => {
    const submittedSessionId = await submitTask()
    if (!submittedSessionId) {
      return
    }

    await runLatestSubmittedTask(submittedSessionId)
  }

  return (
    <div className="space-y-8">
      <section className="surface rounded-[28px] p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-end">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" /> Task Launcher
            </div>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Write one task, copy one command, and start the workflow.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                This page removes the terminal-friction step. Users can draft a task in plain language, assign a session id, and launch ChronicleOS from the same place with one click.
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-3 text-cyan-100">
              <WandSparkles className="h-5 w-5" />
              <p className="text-sm font-medium uppercase tracking-[0.24em]">Quick start</p>
            </div>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <li>1. Paste the task you want ChronicleOS to handle.</li>
              <li>2. Pick a session id so the run is easy to find later.</li>
              <li>3. Click Submit and run latest task to launch it immediately.</li>
            </ol>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <section className="surface rounded-[28px] p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <TerminalSquare className="h-5 w-5 text-cyan-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">Task input</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Describe the work once</h2>
            </div>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Task</span>
              <textarea
                className="mt-2 min-h-40 w-full rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base leading-7 text-white outline-none transition focus:border-cyan-400/40"
                value={task}
                onChange={(event) => setTask(event.target.value)}
                placeholder="What should ChronicleOS research, summarize, or analyze?"
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Session id</span>
              <input
                className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400/40"
                value={sessionId}
                onChange={(event) => setSessionId(event.target.value.replace(/[^a-zA-Z0-9._-]/g, '-'))}
                placeholder="task-1"
              />
            </label>

            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm leading-6 text-slate-400">
              Keep the task specific and outcome-oriented. If it is long, use the task file download so the full prompt stays readable and reusable.
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void submitTask()}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Submit task'}
              </button>
              <button
                type="button"
                onClick={() => void submitAndRunTask()}
                disabled={submitting || running}
                className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-5 py-3 text-sm font-medium text-teal-100 transition hover:bg-teal-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting || running ? 'Launching…' : 'Submit and run latest task'}
              </button>
              <button
                type="button"
                onClick={() => void copyText(taskFileContent, 'task')}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-white"
              >
                {copied === 'task' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy task text
              </button>
            </div>

            {submissionMessage && (
              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-slate-200">
                {submissionMessage}
              </div>
            )}

            {runMessage && (
              <div className="rounded-3xl border border-teal-400/20 bg-teal-400/10 p-4 text-sm leading-6 text-teal-50">
                {runMessage}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="surface rounded-[28px] p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-white">Copy a command</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Choose the command that matches your shell and paste it directly into the terminal.</p>

            <div className="mt-5 space-y-4">
              <CommandCard
                label="Windows PowerShell"
                command={powerShellCommand}
                onCopy={() => void copyText(powerShellCommand, 'powershell')}
                copied={copied === 'powershell'}
              />
              <CommandCard
                label="macOS / Linux"
                command={bashCommand}
                onCopy={() => void copyText(bashCommand, 'bash')}
                copied={copied === 'bash'}
              />
            </div>
          </div>

          <div className="surface rounded-[28px] p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-white">Task file</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Download the task as a plain text file when you want to hand it off, reuse it, or keep it in source control.</p>

            <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/60 p-4">
              <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">{taskFileContent}</pre>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void copyText(taskFileContent, 'task')}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-white"
              >
                {copied === 'task' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy task text
              </button>
              <button
                type="button"
                onClick={downloadTaskFile}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-400/20"
              >
                <Download className="h-4 w-4" />
                Download task file
              </button>
            </div>

            {taskFilePath && (
              <div className="mt-5 space-y-3 rounded-3xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200">
                <p className="text-slate-400">Submitted task file: {taskFilePath}</p>
                <button
                  type="button"
                  onClick={() => void runLatestSubmittedTask(sessionId || defaultSessionId)}
                  disabled={running}
                  className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-4 py-2 text-sm text-teal-100 transition hover:bg-teal-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {running ? 'Running…' : 'Run latest submitted task'}
                </button>
                <CommandCard
                  label="Windows PowerShell launch"
                  command={submissionPowerShellCommand}
                  onCopy={() => void copyText(submissionPowerShellCommand, 'powershell')}
                  copied={copied === 'powershell'}
                />
                <CommandCard
                  label="macOS / Linux launch"
                  command={submissionBashCommand}
                  onCopy={() => void copyText(submissionBashCommand, 'bash')}
                  copied={copied === 'bash'}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function CommandCard({
  label,
  command,
  onCopy,
  copied,
}: {
  label: string
  command: string
  onCopy: () => void
  copied: boolean
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-xs leading-6 text-slate-200">{command}</pre>
    </div>
  )
}