import { useId } from 'react'
import { LuX } from 'react-icons/lu'
import { useOverlay } from '../hooks/useOverlay.js'

export default function Drawer({ title, subtitle, onClose, actions, children }) {
  const titleId = useId()
  const { ref, onKeyDown } = useOverlay(onClose)

  return (
    <div
      className="overlay overlay--drawer"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={ref}
        onKeyDown={onKeyDown}
      >
        <header className="drawer__header">
          <div className="drawer__title">
            <h2 id={titleId}>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <LuX aria-hidden="true" />
          </button>
        </header>
        {actions ? <div className="drawer__actions">{actions}</div> : null}
        <div className="drawer__body">{children}</div>
      </aside>
    </div>
  )
}
