import { TONES } from '../config/tones.js'

export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

/**
 * <StatusBadge kind="lead" value="Qualified" />
 * kind = lead | stage | priority | ticket | activity | role
 */
export function StatusBadge({ kind, value }) {
  if (!value) return null
  return <Badge tone={TONES[kind]?.[value] ?? 'neutral'}>{value}</Badge>
}
