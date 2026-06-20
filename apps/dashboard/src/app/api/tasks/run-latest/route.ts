import { access, mkdir, readFile, readdir, stat } from 'fs/promises'
import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

type RunTaskRequestBody = {
  sessionId?: string
}

type TaskPointer = {
  sessionId: string
  taskFilePath: string
  metadataPath?: string
  submittedAt?: string
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
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    }
  )

  child.unref()

  return {
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
    return NextResponse.json({
      sessionId: pointer.sessionId,
      taskFilePath: run.taskFilePath,
      pid: run.pid,
      command: run.command,
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
