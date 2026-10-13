import { LuInbox } from 'react-icons/lu'

export default function EmptyState({ title, description, action }) {
  return (
    <div className="empty">
      <LuInbox className="empty__icon" aria-hidden="true" />
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ?? null}
    </div>
  )
}
