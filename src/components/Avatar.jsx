import { initials } from '../utils/format.js'

const PALETTE = ['#1D6A61', '#3F6FB5', '#7462D6', '#B0692B', '#A34A6B', '#4C7A3A', '#8A5A08', '#2F7C8C']

function pick(name = '') {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

export default function Avatar({ name, size = 32 }) {
  return (
    <span
      className="avatar"
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4), background: pick(name) }}
    >
      {initials(name)}
    </span>
  )
}

/** Avatar + name (+ optional second line). Used in table rows. */
export function PersonCell({ name, sub, size = 34 }) {
  return (
    <div className="person">
      <Avatar name={name} size={size} />
      <div className="person__text">
        <span className="person__name">{name}</span>
        {sub ? <span className="person__sub">{sub}</span> : null}
      </div>
    </div>
  )
}

/** Small "owner" display: avatar + name, or a muted placeholder. */
export function UserChip({ user, empty = 'Unassigned' }) {
  if (!user) return <span className="muted">{empty}</span>
  return (
    <span className="user-chip">
      <Avatar name={user.full_name} size={22} />
      <span>{user.full_name}</span>
    </span>
  )
}
