'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, Download, Sparkles, TerminalSquare } from 'lucide-react'

const defaultTask = 'Research the latest ChronicleOS workflow improvements and summarize the best next step for users.'
const defaultSessionId = 'task-1'

function escapePowerShellArgument(value: string) {
  return `"${value.split('"').join('`"')}"`
}

function escapeBashArgument(value: string) {
  return `"${value.split('"').join('\\"')}"`
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
    <div className="grid gap-4 xl:h-[calc(100vh-9.5rem)] xl:grid-cols-[1.1fr,0.9fr] xl:gap-5">
      <section className="surface flex min-h-0 flex-col rounded-[28px] p-5 sm:p-6 lg:p-7">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" /> Task Launcher
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Submit and run tasks from one screen.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-[15px]">
                Draft a task, assign a session id, and launch ChronicleOS without leaving the dashboard.
              </p>
            </div>
          </div>

          <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right md:block">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Screen fit</p>
            <p className="mt-1 text-sm text-white">Compact layout</p>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1.05fr,0.95fr]">
          <div className="flex min-h-0 flex-col gap-4 rounded-[24px] border border-white/10 bg-slate-950/45 p-4">
            <div className="flex items-center gap-3">
              <TerminalSquare className="h-5 w-5 text-cyan-300" />
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">Task input</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Describe the work once</h2>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr,220px]">
              <label className="block sm:col-span-2">
                <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Task</span>
                <textarea
                  className="mt-2 min-h-36 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-cyan-400/40"
                  value={task}
                  onChange={(event) => setTask(event.target.value)}
                  placeholder="What should ChronicleOS research, summarize, or analyze?"
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Session id</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                  value={sessionId}
                  onChange={(event) => setSessionId(event.target.value.replace(/[^a-zA-Z0-9._-]/g, '-'))}
                  placeholder="task-1"
                />
              </label>

              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm leading-6 text-slate-400">
                Keep it specific and outcome-oriented. Long tasks still work, but concise prompts fit best.
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => void submitTask()}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Submit task'}
              </button>
              <button
                type="button"
                onClick={() => void submitAndRunTask()}
                disabled={submitting || running}
                className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-4 py-2.5 text-sm font-medium text-teal-100 transition hover:bg-teal-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting || running ? 'Launching…' : 'Submit and run latest task'}
              </button>
              <button
                type="button"
                onClick={() => void copyText(taskFileContent, 'task')}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-white"
              >
                {copied === 'task' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy task
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {submissionMessage && (
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm leading-6 text-slate-200">
                  {submissionMessage}
                </div>
              )}

              {runMessage && (
                <div className="rounded-2xl border border-teal-400/20 bg-teal-400/10 p-3 text-sm leading-6 text-teal-50">
                  {runMessage}
                </div>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-4 rounded-[24px] border border-white/10 bg-slate-950/45 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Run controls</h2>
                <p className="mt-1 text-sm text-slate-400">Copy commands or launch the last submitted task directly.</p>
              </div>
              <button
                type="button"
                onClick={() => void runLatestSubmittedTask(sessionId || defaultSessionId)}
                disabled={running}
                className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-4 py-2 text-sm text-teal-100 transition hover:bg-teal-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {running ? 'Running…' : 'Run latest'}
              </button>
            </div>

            <div className="grid min-h-0 gap-3 lg:grid-rows-[auto_auto_1fr]">
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

              <div className="min-h-0 rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Task file</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-400">A compact preview and download for sharing or reuse.</p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadTaskFile}
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100 transition hover:bg-cyan-400/20"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                </div>

                <div className="mt-3 max-h-[12rem] overflow-auto rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                  <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">{taskFileContent}</pre>
                </div>

                {taskFilePath && (
                  <div className="mt-3 space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-200">
                    <p className="text-slate-400">Submitted task file: {taskFilePath}</p>
                    <CommandCard
                      label="PowerShell launch"
                      command={submissionPowerShellCommand}
                      onCopy={() => void copyText(submissionPowerShellCommand, 'powershell')}
                      copied={copied === 'powershell'}
                    />
                    <CommandCard
                      label="Linux / macOS launch"
                      command={submissionBashCommand}
                      onCopy={() => void copyText(submissionBashCommand, 'bash')}
                      copied={copied === 'bash'}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</p>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-3 py-1.5 text-[11px] text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="mt-2 max-h-24 overflow-auto rounded-xl border border-white/10 bg-slate-950/70 p-2.5 text-[11px] leading-5 text-slate-200">{command}</pre>
    </div>
  )
}