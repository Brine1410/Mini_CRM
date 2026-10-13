import { useMemo, useState } from 'react'
import { DialogContext } from '../context/dialogContext.js'
import { useCrm } from '../context/CrmContext.jsx'
import { useToast } from './Toast.jsx'
import RecordModal from './RecordModal.jsx'
import RecordDrawer from './RecordDrawer.jsx'
import DeleteDialog from './DeleteDialog.jsx'
import { SCHEMA, capitalize } from '../config/schema.js'
import { fullName } from '../utils/format.js'

/** Human-readable name of a record, shown in the delete confirmation. */
function labelFor(table, record) {
  if (!record) return ''
  switch (table) {
    case 'users':
      return record.full_name
    case 'leads':
    case 'contacts':
      return fullName(record)
    case 'accounts':
      return record.account_name
    case 'opportunities':
      return record.title
    case 'tickets':
      return record.subject
    case 'activities':
      return record.subject
    default:
      return ''
  }
}

/**
 * Renders the shared form modal, delete dialog and detail drawer,
 * and hands the open/close functions to every page through context.
 */
export default function DialogHost({ children }) {
  const { get, remove } = useCrm()
  const toast = useToast()

  const [form, setForm] = useState(null) // { table, record, defaults }
  const [pendingDelete, setPendingDelete] = useState(null) // { table, id }
  const [detail, setDetail] = useState(null) // { table, id }

  const api = useMemo(
    () => ({
      openForm: (table, options = {}) =>
        setForm({ table, record: options.record ?? null, defaults: options.defaults ?? null }),
      askDelete: (table, id) => setPendingDelete({ table, id }),
      openDetail: (table, id) => setDetail({ table, id }),
      closeDetail: () => setDetail(null),
    }),
    [],
  )

  function confirmDelete() {
    const { table, id } = pendingDelete
    remove(table, id)
    toast(`${capitalize(SCHEMA[table].singular)} deleted`)
    setPendingDelete(null)
    if (detail && detail.table === table && detail.id === id) setDetail(null)
  }

  return (
    <DialogContext.Provider value={api}>
      {children}

      {detail ? <RecordDrawer table={detail.table} id={detail.id} onClose={() => setDetail(null)} /> : null}

      {form ? (
        <RecordModal
          table={form.table}
          record={form.record}
          defaults={form.defaults}
          onClose={() => setForm(null)}
        />
      ) : null}

      {pendingDelete ? (
        <DeleteDialog
          table={pendingDelete.table}
          id={pendingDelete.id}
          label={labelFor(pendingDelete.table, get(pendingDelete.table, pendingDelete.id))}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      ) : null}
    </DialogContext.Provider>
  )
}
