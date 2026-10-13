import { createContext, useContext, useMemo, useReducer } from 'react'
import { SCHEMA } from '../config/schema.js'
import { createInitialData, CURRENT_USER_ID } from '../data/mockData.js'

/**
 * In-memory "database" for the front-end phase.
 *
 * Everything the pages need goes through this context:
 *   const { data, get, add, update, remove } = useCrm()
 *
 * Later, when the backend exists, replace the reducer with API calls
 * (fetch / axios) and keep the same function names, so the pages stay unchanged.
 */

const CrmContext = createContext(null)

// ---------------------------------------------------------------------------
// Helpers that behave like MySQL
// ---------------------------------------------------------------------------

/** Insert like AUTO_INCREMENT + DEFAULT CURRENT_TIMESTAMP. */
function insertRecord(data, table, values) {
  const pk = SCHEMA[table].pk
  const id = data[table].reduce((max, row) => Math.max(max, row[pk]), 0) + 1
  const record = { ...values, [pk]: id, created_at: new Date().toISOString() }
  return [{ ...data, [table]: [...data[table], record] }, record]
}

/** Delete a row and apply every ON DELETE CASCADE / SET NULL rule from the schema. */
function deleteRecord(data, table, id) {
  const pk = SCHEMA[table].pk
  let next = { ...data, [table]: data[table].filter((row) => row[pk] !== id) }

  for (const [childTable, childDef] of Object.entries(SCHEMA)) {
    for (const fk of childDef.fks) {
      if (fk.ref !== table) continue

      if (fk.onDelete === 'cascade') {
        const doomed = next[childTable].filter((row) => row[fk.field] === id)
        for (const row of doomed) {
          next = deleteRecord(next, childTable, row[childDef.pk])
        }
      } else {
        next = {
          ...next,
          [childTable]: next[childTable].map((row) =>
            row[fk.field] === id ? { ...row, [fk.field]: null } : row,
          ),
        }
      }
    }
  }
  return next
}

/** What else would change if this record were deleted? Used by the confirm dialog. */
export function deleteImpact(data, table, id) {
  const after = deleteRecord(data, table, id)
  const removed = {}
  const unlinked = {}

  for (const [name, def] of Object.entries(SCHEMA)) {
    const gone = data[name].length - after[name].length - (name === table ? 1 : 0)
    if (gone > 0) removed[name] = gone

    const survivors = new Map(after[name].map((row) => [row[def.pk], row]))
    let changed = 0
    for (const before of data[name]) {
      const now = survivors.get(before[def.pk])
      if (!now) continue
      if (def.fks.some((fk) => before[fk.field] != null && now[fk.field] == null)) changed += 1
    }
    if (changed > 0) unlinked[name] = changed
  }
  return { removed, unlinked }
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
function reducer(data, action) {
  switch (action.type) {
    case 'ADD': {
      const [next] = insertRecord(data, action.table, action.values)
      return next
    }

    case 'UPDATE': {
      const pk = SCHEMA[action.table].pk
      return {
        ...data,
        [action.table]: data[action.table].map((row) =>
          row[pk] === action.id ? { ...row, ...action.values } : row,
        ),
      }
    }

    case 'DELETE':
      return deleteRecord(data, action.table, action.id)

    case 'CONVERT_LEAD': {
      const lead = data.leads.find((row) => row.lead_id === action.id)
      if (!lead) return data

      const [withAccount, account] = insertRecord(data, 'accounts', {
        account_name: lead.company_name || `${lead.first_name} ${lead.last_name}`,
        industry: null,
        website: null,
        annual_revenue: null,
        owner_user_id: lead.assigned_user_id,
      })
      const [withContact] = insertRecord(withAccount, 'contacts', {
        account_id: account.account_id,
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        job_title: null,
        owner_user_id: lead.assigned_user_id,
      })
      return {
        ...withContact,
        leads: withContact.leads.map((row) =>
          row.lead_id === lead.lead_id ? { ...row, status: 'Converted' } : row,
        ),
      }
    }

    default:
      return data
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function CrmProvider({ children }) {
  const [data, dispatch] = useReducer(reducer, undefined, createInitialData)

  const actions = useMemo(
    () => ({
      add: (table, values) => dispatch({ type: 'ADD', table, values }),
      update: (table, id, values) => dispatch({ type: 'UPDATE', table, id, values }),
      remove: (table, id) => dispatch({ type: 'DELETE', table, id }),
      convertLead: (id) => dispatch({ type: 'CONVERT_LEAD', id }),
    }),
    [],
  )

  const value = useMemo(() => {
    const maps = {}
    for (const [table, def] of Object.entries(SCHEMA)) {
      maps[table] = new Map(data[table].map((row) => [row[def.pk], row]))
    }
    const currentUser = maps.users.get(CURRENT_USER_ID) ?? data.users[0] ?? null

    return {
      data,
      currentUser,
      /** get('accounts', 3) -> the account row, or undefined */
      get: (table, id) => (id == null ? undefined : maps[table].get(id)),
      impactOf: (table, id) => deleteImpact(data, table, id),
      ...actions,
    }
  }, [data, actions])

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>
}

export function useCrm() {
  const context = useContext(CrmContext)
  if (!context) throw new Error('useCrm must be used inside <CrmProvider>')
  return context
}
