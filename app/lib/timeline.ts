import type { Task } from '~/lib/types'

const FALLBACK_LENGTH = 60

export const sortByTime = (tasks: Task[]) => {
  const timed = tasks
    .filter((task) => task.startMinutes !== null)
    .sort((a, b) => (a.startMinutes ?? 0) - (b.startMinutes ?? 0))
  return [...timed, ...tasks.filter((task) => task.startMinutes === null)]
}

export interface Timeline {
  lineBefore: string | null
  lineAfter: string | null
  activeId: string | null
}

export const timelineAt = (tasks: Task[], now: number): Timeline => {
  const timed = tasks.filter((task) => task.startMinutes !== null)
  const started = timed.filter((task) => (task.startMinutes ?? 0) <= now)
  const current = started.at(-1)
  const next = timed.find((task) => (task.startMinutes ?? 0) > now)

  let activeId: string | null = null
  if (current && current.status === 'OPEN') {
    const start = current.startMinutes ?? 0
    const length =
      current.durationMinutes ?? (next ? (next.startMinutes ?? 0) - start : FALLBACK_LENGTH)
    if (now < start + length) activeId = current.id
  }

  return {
    lineBefore: next?.id ?? null,
    lineAfter: next ? null : (current?.id ?? null),
    activeId,
  }
}
