export type Locale = 'en' | 'ru' | 'uk'
export type ProjectArea = 'WORK' | 'PERSONAL'
export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH'
export type TaskStatus = 'OPEN' | 'DONE'

export interface User {
  id: string
  email: string
  displayName: string | null
  locale: Locale
  timezone: string
  dayStartMinutes: number
  dayEndMinutes: number
  hasPassword: boolean
  googleLinked: boolean
  onboarded: boolean
  createdAt: string
}

export interface Session {
  accessToken: string
  expiresIn: number
  user: User
}

export interface VerificationPending {
  email: string
  resendAfterSeconds: number
}

export interface Meta {
  googleClientId: string | null
}

export interface AiProvider {
  isConfigured: boolean
  baseUrl: string | null
  modelName: string | null
  apiKeyHint: string | null
}

export interface AiProviderInput {
  baseUrl: string
  modelName: string
  apiKey?: string
}

export interface CatalogProvider {
  id: string
  label: string
  baseUrl: string
  apiKeysUrl: string
  keyHint: string
  defaultModel: string
  models: string[]
}

export interface ProviderModels {
  models: string[]
  fetchedAt: string | null
}

export interface AiProviderCheck {
  ok: boolean
  code: string | null
  message: string | null
}

export interface Project {
  id: string
  name: string
  code: string
  area: ProjectArea
  description: string | null
  position: number
  archived: boolean
  openTasks: number
  doneTasks: number
  createdAt: string
}

export interface ProjectInput {
  name: string
  code: string
  area: ProjectArea
  description?: string | null
  archived?: boolean
}

export interface Task {
  id: string
  title: string
  notes: string | null
  date: string | null
  startMinutes: number | null
  durationMinutes: number | null
  priority: TaskPriority
  status: TaskStatus
  position: number
  completedAt: string | null
  projectId: string | null
  createdAt: string
}

export interface TaskInput {
  title: string
  notes?: string | null
  date?: string | null
  startMinutes?: number | null
  durationMinutes?: number | null
  priority?: TaskPriority
  projectId?: string | null
}

export interface TaskPatch extends Partial<TaskInput> {
  status?: TaskStatus
}

export interface TaskDraft {
  title: string
  notes: string | null
  date: string | null
  startMinutes: number | null
  durationMinutes: number | null
  priority: TaskPriority
  projectId: string | null
}

export interface PlanItem {
  taskId: string
  startMinutes: number
  durationMinutes: number
  note: string | null
}

export interface Plan {
  date: string
  summary: string
  items: PlanItem[]
  unscheduled: { taskId: string; reason: string }[]
}

export interface Tip {
  title: string
  body: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  drafts?: TaskDraft[]
}

export interface DailyPoint {
  date: string
  planned: number
  completed: number
  focusMinutes: number
}

export interface Insights {
  from: string
  to: string
  daily: DailyPoint[]
  byProject: { projectId: string | null; completed: number; open: number }[]
  byWeekday: number[]
  completed: number
  planned: number
  completionRate: number
  focusMinutes: number
  currentStreak: number
  bestStreak: number
  overdue: number
  inbox: number
}
