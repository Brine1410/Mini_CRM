export default function IconButton({ label, onClick, children, tone, disabled }) {
  return (
    <button
      type="button"
      className={`icon-btn${tone ? ` icon-btn--${tone}` : ''}`}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.(event)
      }}
    >
      {children}
    </button>
  )
}
