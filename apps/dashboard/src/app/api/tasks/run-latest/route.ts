import { access, readFile, readdir, stat } from 'fs/promises'
import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'
import { readMemoryEntry } from '@/lib/server/memwal-store'

export const runtime = 'nodejs'

type RunTaskRequestBody = {
  sessionId?: string
}

type TaskPointer = {
  sessionId: string
  taskFilePath: string
  metadataPath?: string
  submittedAt?: string
}

type TaskMetadata = {
  sessionId?: string
  task?: string
  taskFilePath?: string
  submittedAt?: string
}

type WorkflowResult = {
  taskId: string
  taskDescription: string
  status: string
  research: {
    summary: string
    sources: number
    walrusCid?: string
  } | null
  architecture: {
    synthesisNotes: string
    artifacts: Array<{
      name: string
      type: string
      walrusCid?: string
      metadata?: Record<string, unknown>
    }>
  } | null
  audit: {
    qualityScore: number
    approved: boolean
    feedback: string
    findings: Array<{
      severity: string
      message: string
      suggestedAction?: string
      artifactName?: string
    }>
  } | null
}

function getRepoRoot() {
  return join(process.cwd(), '..', '..')
}

function getTaskStoreDir() {
  return join(getRepoRoot(), 'data', 'task-requests')
}

function getAgentsDirectory() {
  return join(getRepoRoot(), 'apps', 'agents')
}

function getPythonExecutable() {
  if (process.platform === 'win32') {
    return join(getRepoRoot(), '.venv', 'Scripts', 'python.exe')
  }

  return join(getRepoRoot(), '.venv', 'bin', 'python')
}

function getTaskFilePath(sessionId: string) {
  return join(getTaskStoreDir(), `${sessionId}.task.txt`)
}

function getMetadataPath(sessionId: string) {
  return join(getTaskStoreDir(), `${sessionId}.json`)
}

async function readTaskPointerFromDisk(): Promise<TaskPointer | null> {
  const pointerPath = join(getTaskStoreDir(), 'latest.json')

  try {
    const raw = await readFile(pointerPath, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<TaskPointer>
    if (!parsed.sessionId) {
      return null
    }

    return {
      sessionId: parsed.sessionId,
      taskFilePath: parsed.taskFilePath ?? `data/task-requests/${parsed.sessionId}.task.txt`,
      metadataPath: parsed.metadataPath,
      submittedAt: parsed.submittedAt,
    }
  } catch {
    return null
  }
}

async function findLatestTaskPointer(): Promise<TaskPointer | null> {
  const pointer = await readTaskPointerFromDisk()
  if (pointer) {
    return pointer
  }

  try {
    const entries = await readdir(getTaskStoreDir(), { withFileTypes: true })
    const metadataFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'latest.json')

    let latestSessionId: string | null = null
    let latestTimestamp = 0

    for (const entry of metadataFiles) {
      const sessionId = entry.name.replace(/\.json$/, '')
      const metadata = getMetadataPath(sessionId)

      try {
        const fileStat = await stat(metadata)
        if (fileStat.mtimeMs >= latestTimestamp) {
          latestTimestamp = fileStat.mtimeMs
          latestSessionId = sessionId
        }
      } catch {
        continue
      }
    }

    if (!latestSessionId) {
      return null
    }

    return {
      sessionId: latestSessionId,
      taskFilePath: `data/task-requests/${latestSessionId}.task.txt`,
      metadataPath: `data/task-requests/${latestSessionId}.json`,
    }
  } catch {
    return null
  }
}

async function resolveTaskPointer(sessionId?: string): Promise<TaskPointer | null> {
  if (sessionId) {
    return {
      sessionId,
      taskFilePath: `data/task-requests/${sessionId}.task.txt`,
      metadataPath: `data/task-requests/${sessionId}.json`,
    }
  }

  return await findLatestTaskPointer()
}

async function readTaskMetadata(sessionId: string): Promise<TaskMetadata | null> {
  try {
    const raw = await readFile(join(getTaskStoreDir(), `${sessionId}.json`), 'utf-8')
    return JSON.parse(raw) as TaskMetadata
  } catch {
    return null
  }
}

async function readWorkflowResult(sessionId: string): Promise<WorkflowResult | null> {
  const [researchEntry, architectureEntry, auditEntry] = await Promise.all([
    readMemoryEntry(`research:${sessionId}`),
    readMemoryEntry(`architect:${sessionId}`),
    readMemoryEntry(`audit:${sessionId}`),
  ])

  if (!researchEntry || !architectureEntry || !auditEntry) {
    return null
  }

  const researchPayload = researchEntry.data?.result as Record<string, unknown> | undefined
  const architecturePayload = architectureEntry.data as Record<string, unknown> | undefined
  const auditPayload = auditEntry.data as Record<string, unknown> | undefined

  return {
    taskId: sessionId,
    taskDescription: (researchPayload?.description as string | undefined) ?? '',
    status: 'completed',
    research: {
      summary: (researchPayload?.summary as string | undefined) ?? '',
      sources: Array.isArray(researchPayload?.sources) ? researchPayload.sources.length : 0,
      walrusCid: (researchEntry.data?.walrus_cid as string | undefined) ?? undefined,
    },
    architecture: {
      synthesisNotes: (architecturePayload?.synthesis_notes as string | undefined) ?? '',
      artifacts: Array.isArray(architecturePayload?.artifacts)
        ? architecturePayload.artifacts.map((artifact) => ({
            name: String((artifact as Record<string, unknown>).name ?? ''),
            type: String((artifact as Record<string, unknown>).type ?? 'artifact'),
            walrusCid: (artifact as Record<string, unknown>).walrus_cid as string | undefined,
            metadata: ((artifact as Record<string, unknown>).metadata as Record<string, unknown> | undefined) ?? undefined,
          }))
        : [],
    },
    audit: {
      qualityScore: Number(auditPayload?.quality_score ?? 0),
      approved: Boolean(auditPayload?.approved),
      feedback: String(auditPayload?.feedback ?? ''),
      findings: Array.isArray(auditPayload?.findings)
        ? auditPayload.findings.map((finding) => ({
            severity: String((finding as Record<string, unknown>).severity ?? 'info'),
            message: String((finding as Record<string, unknown>).message ?? ''),
            suggestedAction: (finding as Record<string, unknown>).suggested_action as string | undefined,
            artifactName: (finding as Record<string, unknown>).artifact_name as string | undefined,
          }))
        : [],
    },
  }
}

async function runTaskWorkflow(pointer: TaskPointer) {
  const repoRoot = getRepoRoot()
  const agentsDir = getAgentsDirectory()
  const pythonExecutable = getPythonExecutable()
  const taskFilePath = getTaskFilePath(pointer.sessionId)

  if (!existsSync(pythonExecutable)) {
    throw new Error(`Python executable not found: ${pythonExecutable}`)
  }

  await access(taskFilePath)

  const child = spawn(
    pythonExecutable,
    ['main.py', '--task-file', taskFilePath, '--session-id', pointer.sessionId],
    {
      cwd: agentsDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }
  )

  let stdout = ''
  let stderr = ''

  child.stdout?.on('data', (chunk) => {
    stdout += chunk.toString()
  })

  child.stderr?.on('data', (chunk) => {
    stderr += chunk.toString()
  })

  const exitCode = await new Promise<number>((resolve, reject) => {
    child.once('error', reject)
    child.once('close', (code) => resolve(code ?? -1))
  })

  return {
    exitCode,
    stdout,
    stderr,
    pid: child.pid,
    command: `${pythonExecutable} main.py --task-file ${taskFilePath} --session-id ${pointer.sessionId}`,
    taskFilePath,
    repoRoot,
  }
}

export async function POST(request: Request) {
  let body: RunTaskRequestBody | null = null

  try {
    body = (await request.json()) as RunTaskRequestBody
  } catch {
    body = null
  }

  const pointer = await resolveTaskPointer(body?.sessionId)
  if (!pointer) {
    return NextResponse.json({ error: 'No submitted task found yet.' }, { status: 404 })
  }

  try {
    const run = await runTaskWorkflow(pointer)
    const metadata = await readTaskMetadata(pointer.sessionId)
    const workflowResult = await readWorkflowResult(pointer.sessionId)

    if (run.exitCode !== 0) {
      return NextResponse.json(
        {
          error: `Task run failed with exit code ${run.exitCode}.`,
          sessionId: pointer.sessionId,
          command: run.command,
          stdout: run.stdout,
          stderr: run.stderr,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sessionId: pointer.sessionId,
      taskFilePath: run.taskFilePath,
      command: run.command,
      exitCode: run.exitCode,
      stdout: run.stdout,
      stderr: run.stderr,
      task: metadata?.task,
      submittedAt: metadata?.submittedAt,
      result: workflowResult,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to launch the latest submitted task.',
        sessionId: pointer.sessionId,
      },
      { status: 500 }
    )
  }
}
