import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { SCHEMA } from '../config/schema.js'
import { api } from '../api/client.js'

/**
 * Data layer for the CRM, backed by the Java servlet API (backend/).
 *
 * Everything the pages need goes through this context:
 *   const { data, get, add, update, remove } = useCrm()
 *
 * `data` mirrors the database (one array per table) and is refreshed from the
 * server after each mutation, so page components never talk to the API
 * directly. Deletes are applied optimistically (the local ON DELETE CASCADE /
 * SET NULL emulation matches what MySQL does, so the UI updates instantly and
 * the server confirms afterwards).
 */

// The person "signed in" to the demo. Change the id to view the app as someone else.
const CURRENT_USER_ID = 1

const CrmContext = createContext(null)

// ---------------------------------------------------------------------------
// Helpers that behave like MySQL (used for optimistic deletes and for the
// "what else will be deleted" dialog — the server applies the real rules)
// ---------------------------------------------------------------------------

/** Delete a row locally and apply every ON DELETE CASCADE / SET NULL rule. */
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

const EMPTY_DATA = Object.fromEntries(Object.keys(SCHEMA).map((table) => [table, []]))

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function CrmProvider({ children }) {
  const [data, setData] = useState(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    const tables = Object.keys(SCHEMA)
    const results = await Promise.all(tables.map((table) => api.list(table)))
    const fresh = {}
    tables.forEach((table, index) => {
      fresh[table] = results[index]
    })
    setData(fresh)
  }, [])

  useEffect(() => {
    let cancelled = false
    reload()
      .catch((err) => {
        console.error('Could not load CRM data from the API:', err)
        if (!cancelled) setError(err.message || 'Could not reach the API')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reload])

  const actions = useMemo(
    () => ({
      // Creates a row and adds the server-returned record (real id, created_at).
      add: async (table, values) => {
        const record = await api.create(table, values)
        setData((current) => ({ ...current, [table]: [...current[table], record] }))
        return record
      },

      update: async (table, id, values) => {
        const pk = SCHEMA[table].pk
        const row = await api.update(table, id, values)
        setData((current) => ({
          ...current,
          [table]: current[table].map((existing) => (existing[pk] === row[pk] ? row : existing)),
        }))
        return row
      },

      // Optimistic: cascade locally right away, then confirm with the server.
      remove: async (table, id) => {
        setData((current) => deleteRecord(current, table, id))
        try {
          await api.remove(table, id)
        } catch (err) {
          console.error('Delete failed, resyncing with the server:', err)
          await reload()
        }
      },

      convertLead: async (id) => {
        const { lead, account, contact } = await api.convertLead(id)
        setData((current) => ({
          ...current,
          leads: current.leads.map((row) => (row.lead_id === lead.lead_id ? lead : row)),
          accounts: [...current.accounts, account],
          contacts: [...current.contacts, contact],
        }))
        return { lead, account, contact }
      },
    }),
    [reload],
  )

  const value = useMemo(() => {
    const maps = {}
    for (const [table, def] of Object.entries(SCHEMA)) {
      maps[table] = new Map(data[table].map((row) => [row[def.pk], row]))
    }
    const currentUser = maps.users.get(CURRENT_USER_ID) ?? data.users[0] ?? null

    return {
      data,
      loading,
      error,
      currentUser,
      /** get('accounts', 3) -> the account row, or undefined */
      get: (table, id) => (id == null ? undefined : maps[table].get(id)),
      impactOf: (table, id) => deleteImpact(data, table, id),
      reload,
      ...actions,
    }
  }, [data, loading, error, reload, actions])

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>
}

export function useCrm() {
  const context = useContext(CrmContext)
  if (!context) throw new Error('useCrm must be used inside <CrmProvider>')
  return context
}
