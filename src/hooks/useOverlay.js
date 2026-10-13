import { useCallback, useEffect, useRef } from 'react'

// Every open dialog/drawer registers here so Escape only closes the top one.
const stack = []

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Shared behaviour for modals and drawers:
 * Escape to close (top-most only), page scroll lock, focus moved inside,
 * focus trapped while open and restored when closed.
 */
export function useOverlay(onClose) {
  const ref = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const id = Symbol('overlay')
    stack.push(id)

    const previouslyFocused = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const node = ref.current
    if (node && !node.contains(document.activeElement)) node.focus()

    function handleKey(event) {
      if (event.key === 'Escape' && stack[stack.length - 1] === id) {
        closeRef.current()
      }
    }
    document.addEventListener('keydown', handleKey)

    return () => {
      document.removeEventListener('keydown', handleKey)
      const index = stack.indexOf(id)
      if (index >= 0) stack.splice(index, 1)
      document.body.style.overflow = previousOverflow
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus()
      }
    }
  }, [])

  const onKeyDown = useCallback((event) => {
    if (event.key !== 'Tab') return
    const node = ref.current
    if (!node) return
    const items = node.querySelectorAll(FOCUSABLE)
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]

    if (event.shiftKey && (document.activeElement === first || document.activeElement === node)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }, [])

  return { ref, onKeyDown }
}
