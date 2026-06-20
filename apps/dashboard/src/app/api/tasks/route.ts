import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { NextResponse } from 'next/server'

type TaskRequestBody = {
  task?: string
  sessionId?: string
}

function sanitizeSessionId(value: string | undefined) {
  const trimmed = (value ?? '').trim()
  const sanitized = trimmed.replace(/[^a-zA-Z0-9._-]/g, '-')
  return sanitized || `task-${Date.now()}`
}

function getTaskStoreDir() {
  return join(process.cwd(), '..', '..', 'data', 'task-requests')
}

function buildLaunchCommands(sessionId: string) {
  const taskFilePath = `data/task-requests/${sessionId}.task.txt`

  return {
    taskFilePath,
    windowsPowerShell: `..\\.venv\\Scripts\\python.exe apps\\agents\\main.py --task-file ${taskFilePath} --session-id ${sessionId}`,
    bash: `./.venv/bin/python apps/agents/main.py --task-file ${taskFilePath} --session-id ${sessionId}`,
  }
}

function getLatestTaskPointerPath() {
  return join(getTaskStoreDir(), 'latest.json')
}

export async function POST(request: Request) {
  let body: TaskRequestBody

  try {
    body = (await request.json()) as TaskRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 })
  }

  const task = body.task?.trim()
  if (!task) {
    return NextResponse.json({ error: 'Task text is required.' }, { status: 400 })
  }

  const sessionId = sanitizeSessionId(body.sessionId)
  const storeDir = getTaskStoreDir()
  const taskFilePath = join(storeDir, `${sessionId}.task.txt`)
  const metadataPath = join(storeDir, `${sessionId}.json`)
  const commands = buildLaunchCommands(sessionId)
  const submittedAt = new Date().toISOString()

  await mkdir(storeDir, { recursive: true })
  await writeFile(taskFilePath, `${task}\n`, 'utf-8')
  await writeFile(
    metadataPath,
    JSON.stringify(
      {
        sessionId,
        task,
        taskFilePath: commands.taskFilePath,
        submittedAt,
      },
      null,
      2
    ),
    'utf-8'
  )
  await writeFile(
    getLatestTaskPointerPath(),
    JSON.stringify(
      {
        sessionId,
        taskFilePath: commands.taskFilePath,
        metadataPath: `data/task-requests/${sessionId}.json`,
        submittedAt,
      },
      null,
      2
    ),
    'utf-8'
  )

  return NextResponse.json({
    sessionId,
    task,
    submittedAt,
    ...commands,
  })
}
