import { useMemo, useState } from 'react'
import { LuArrowDown, LuArrowUp, LuArrowUpDown } from 'react-icons/lu'
import EmptyState from './EmptyState.jsx'

/**
 * columns: [{ key, header, render(row), sortValue?(row), className?, align? }]
 * Columns with a `sortValue` get a clickable header.
 */
export default function DataTable({ columns, rows, rowKey, onRowClick, defaultSort, empty, caption }) {
  const [sort, setSort] = useState(defaultSort ?? null)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const column = columns.find((item) => item.key === sort.key)
    if (!column || !column.sortValue) return rows
    const direction = sort.dir === 'asc' ? 1 : -1

    return [...rows].sort((a, b) => {
      const left = column.sortValue(a)
      const right = column.sortValue(b)
      if (left == null && right == null) return 0
      if (left == null) return 1
      if (right == null) return -1
      if (typeof left === 'string' || typeof right === 'string') {
        return String(left).localeCompare(String(right)) * direction
      }
      return (left - right) * direction
    })
  }, [rows, columns, sort])

  function toggleSort(key) {
    setSort((current) =>
      current && current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    )
  }

  if (rows.length === 0) {
    return (
      <div className="panel">
        <EmptyState
          title={empty?.title ?? 'Nothing here yet'}
          description={empty?.description}
          action={empty?.action}
        />
      </div>
    )
  }

  return (
    <div className="panel table-panel">
      <div className="table-wrap">
        <table className="table">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr>
              {columns.map((column) => {
                const isSorted = sort && sort.key === column.key
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={column.align === 'right' ? 'is-right' : undefined}
                    aria-sort={isSorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    {column.sortValue ? (
                      <button type="button" className="th-sort" onClick={() => toggleSort(column.key)}>
                        {column.header}
                        {isSorted ? (
                          sort.dir === 'asc' ? <LuArrowUp aria-hidden="true" /> : <LuArrowDown aria-hidden="true" />
                        ) : (
                          <LuArrowUpDown aria-hidden="true" className="th-sort__idle" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={rowKey(row)}
                className={onRowClick ? 'is-clickable' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                          event.preventDefault()
                          onRowClick(row)
                        }
                      }
                    : undefined
                }
              >
                {columns.map((column) => (
                  <td key={column.key} className={column.align === 'right' ? 'is-right' : column.className}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-foot">
        Showing {rows.length} {rows.length === 1 ? 'record' : 'records'}
      </div>
    </div>
  )
}
