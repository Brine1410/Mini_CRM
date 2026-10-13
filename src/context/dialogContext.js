import { createContext, useContext } from 'react'

/**
 * Lets any page open the shared dialogs without owning their state:
 *   const { openForm, askDelete, openDetail } = useDialogs()
 *
 *   openForm('leads')                              -> "Add lead" form
 *   openForm('leads', { record: lead })            -> "Edit lead" form
 *   openForm('activities', { defaults: {...} })    -> "Add activity" with prefilled values
 *   askDelete('leads', id)                         -> confirm dialog (shows what else is affected)
 *   openDetail('leads', id)                        -> side panel with details + activity history
 */
export const DialogContext = createContext(null)

export function useDialogs() {
  const context = useContext(DialogContext)
  if (!context) throw new Error('useDialogs must be used inside <DialogHost>')
  return context
}
