const KEY = 'label_time_limits'
const DEFAULT_KEY = '__default__'

function load(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

function save(data: Record<string, number>): void {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function getDefaultTimeLimit(): number {
  return load()[DEFAULT_KEY] ?? 0
}

export function setDefaultTimeLimit(seconds: number): void {
  const data = load()
  if (seconds > 0) {
    data[DEFAULT_KEY] = seconds
  } else {
    delete data[DEFAULT_KEY]
  }
  save(data)
}

export function getLabelTimeLimits(): Record<string, number> {
  const data = load()
  const { [DEFAULT_KEY]: _, ...labels } = data
  return labels
}

export function setLabelTimeLimit(label: string, seconds: number): void {
  const data = load()
  if (seconds > 0) {
    data[label] = seconds
  } else {
    delete data[label]
  }
  save(data)
}

export function getEffectiveTimeLimit(activeLabels: string[]): number {
  const data = load()
  const defaultLimit = data[DEFAULT_KEY] ?? 0

  if (activeLabels.length === 0) return defaultLimit

  const limits = activeLabels.map((label) =>
    data[label] != null ? data[label] : defaultLimit
  )
  return Math.max(...limits)
}
