// ---------------------------------------------------------------------------
// Currency: change these two values to switch the whole app (e.g. INR / en-IN)
// ---------------------------------------------------------------------------
export const CURRENCY = { code: 'USD', locale: 'en-US' }

const moneyFmt = new Intl.NumberFormat(CURRENCY.locale, {
  style: 'currency',
  currency: CURRENCY.code,
  maximumFractionDigits: 0,
})
const compactFmt = new Intl.NumberFormat(CURRENCY.locale, {
  style: 'currency',
  currency: CURRENCY.code,
  notation: 'compact',
  maximumFractionDigits: 1,
})

export const isBlank = (value) => value === null || value === undefined || value === ''

export const formatMoney = (value) => (isBlank(value) ? '—' : moneyFmt.format(Number(value)))
export const formatCompactMoney = (value) => (isBlank(value) ? '—' : compactFmt.format(Number(value)))

// ---------------------------------------------------------------------------
// Dates. The database has `date` (close_date) and `timestamp` columns.
// Date-only strings ("2026-10-05") are parsed as local dates so they never
// shift by a day because of the time zone.
// ---------------------------------------------------------------------------
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const pad = (n) => String(n).padStart(2, '0')

export function toDate(value) {
  if (isBlank(value)) return null
  if (value instanceof Date) return value
  if (DATE_ONLY.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value) {
  const date = toDate(value)
  return date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
}

export function formatShortDate(value) {
  const date = toDate(value)
  return date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'
}

export function formatDateTime(value) {
  const date = toDate(value)
  return date
    ? date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—'
}

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

/** "Today", "Tomorrow", "In 3 days", "2 days ago" ... */
export function relativeDay(value) {
  const date = toDate(value)
  if (!date) return ''
  const diff = Math.round((startOfDay(date) - startOfDay(new Date())) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return diff > 0 ? `In ${diff} days` : `${Math.abs(diff)} days ago`
}

export function toDateInput(value) {
  const date = toDate(value)
  return date ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` : ''
}

export function toDateTimeInput(value) {
  const date = toDate(value)
  if (!date) return ''
  return `${toDateInput(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function fromDateTimeInput(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/** ISO timestamp N days from now (used to keep the sample data fresh). */
export function daysFromNow(days, hour = 10) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

/** "YYYY-MM-DD" N days from now. */
export function dateFromNow(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return toDateInput(date)
}

export function isOverdue(activity) {
  if (!activity || activity.status !== 'Pending' || !activity.due_date) return false
  const due = toDate(activity.due_date)
  return Boolean(due) && due.getTime() < Date.now()
}

// ---------------------------------------------------------------------------
// Names
// ---------------------------------------------------------------------------
export const fullName = (person) => (person ? `${person.first_name} ${person.last_name}` : '')

export function initials(name = '') {
  const parts = name.replace(/^(dr|mr|mrs|ms)\.?\s+/i, '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export const displayUrl = (url = '') => url.replace(/^https?:\/\//, '').replace(/\/$/, '')
export const toHref = (url = '') => (/^https?:\/\//.test(url) ? url : `https://${url}`)
