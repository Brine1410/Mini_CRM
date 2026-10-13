import { useId } from 'react'
import { LuX } from 'react-icons/lu'
import { useOverlay } from '../hooks/useOverlay.js'

export default function Modal({ title, description, onClose, children, footer, size = 'md' }) {
  const titleId = useId()
  const { ref, onKeyDown } = useOverlay(onClose)

  return (
    <div
      className="overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={`dialog dialog--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={ref}
        onKeyDown={onKeyDown}
      >
        <header className="dialog__header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <LuX aria-hidden="true" />
          </button>
        </header>
        <div className="dialog__body">{children}</div>
        {footer ? <footer className="dialog__footer">{footer}</footer> : null}
      </div>
    </div>
  )
}
