import { LuTriangleAlert } from 'react-icons/lu'
import Modal from './Modal.jsx'
import { useCrm } from '../context/CrmContext.jsx'
import { SCHEMA, capitalize } from '../config/schema.js'

const listOf = (counts) =>
  Object.entries(counts)
    .map(([table, count]) => `${count} ${count === 1 ? SCHEMA[table].singular : SCHEMA[table].plural}`)
    .join(', ')

/** Mirrors the foreign keys in the SQL: "ON DELETE CASCADE" rows disappear, "SET NULL" rows lose the link. */
export default function DeleteDialog({ table, id, label, onCancel, onConfirm }) {
  const { impactOf } = useCrm()
  const { removed, unlinked } = impactOf(table, id)
  const hasRemoved = Object.keys(removed).length > 0
  const hasUnlinked = Object.keys(unlinked).length > 0

  return (
    <Modal
      title={`Delete ${SCHEMA[table].singular}?`}
      size="sm"
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onCancel} autoFocus>
            Keep {SCHEMA[table].singular}
          </button>
          <button type="button" className="btn btn--danger" onClick={onConfirm}>
            Delete {SCHEMA[table].singular}
          </button>
        </>
      }
    >
      <div className="confirm">
        <LuTriangleAlert className="confirm__icon" aria-hidden="true" />
        <div className="confirm__text">
          <p>
            <strong>{label}</strong> will be removed permanently.
          </p>
          {hasRemoved ? (
            <p>
              This also deletes {listOf(removed)} linked to it.
            </p>
          ) : null}
          {hasUnlinked ? (
            <p>{capitalize(listOf(unlinked))} will stay but lose their link to this {SCHEMA[table].singular}.</p>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}
