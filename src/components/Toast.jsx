import { createContext, useCallback, useContext, useState } from 'react'
import { LuCheck, LuTriangleAlert } from 'react-icons/lu'

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const toast = useCallback((message, tone = 'success') => {
    const id = `${Date.now()}-${Math.random()}`
    setItems((current) => [...current, { id, message, tone }])
    setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3200)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-region" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className={`toast toast--${item.tone}`}>
            {item.tone === 'error' ? <LuTriangleAlert aria-hidden="true" /> : <LuCheck aria-hidden="true" />}
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
