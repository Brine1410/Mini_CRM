import { useMemo, useState } from 'react'
import { LuChevronLeft, LuChevronRight, LuLayoutGrid, LuList, LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu'
import PageHeader from '../components/PageHeader.jsx'
import DataTable from '../components/DataTable.jsx'
import IconButton from '../components/IconButton.jsx'
import Avatar, { UserChip } from '../components/Avatar.jsx'
import { StatusBadge } from '../components/Badge.jsx'
import { SearchInput, SelectFilter } from '../components/Toolbar.jsx'
import { useToast } from '../components/Toast.jsx'
import { useCrm } from '../context/CrmContext.jsx'
import { useDialogs } from '../context/dialogContext.js'
import { ENUMS } from '../config/schema.js'
import { STAGE_COLORS } from '../config/tones.js'
import { formatCompactMoney, formatDate, formatMoney, formatShortDate } from '../utils/format.js'

const STAGES = ENUMS.oppStage

/** One column per stage. Cards can be dragged between columns or moved with the arrow buttons. */
function Board({ opportunities, get, onOpen, onMove }) {
  const [dragId, setDragId] = useState(null)
  const [overStage, setOverStage] = useState(null)

  return (
    <div className="board">
      {STAGES.map((stage) => {
        const items = opportunities.filter((opp) => opp.stage === stage)
        const total = items.reduce((value, opp) => value + Number(opp.amount || 0), 0)

        return (
          <section
            key={stage}
            className={`board__col${overStage === stage ? ' is-over' : ''}`}
            style={{ '--stage-color': STAGE_COLORS[stage] }}
            aria-label={`${stage}, ${items.length} opportunities`}
            onDragOver={(event) => {
              event.preventDefault()
              if (overStage !== stage) setOverStage(stage)
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setOverStage(null)
            }}
            onDrop={(event) => {
              event.preventDefault()
              const id = Number(event.dataTransfer.getData('text/plain')) || dragId
              setOverStage(null)
              setDragId(null)
              if (id) onMove(id, stage)
            }}
          >
            <header className="board__head">
              <h2>{stage}</h2>
              <span className="board__count">{items.length}</span>
              <span className="board__total">{formatCompactMoney(total)}</span>
            </header>

            <div className="board__cards">
              {items.length === 0 ? <p className="board__empty">Drop a deal here</p> : null}
              {items.map((opp) => {
                const account = get('accounts', opp.account_id)
                const owner = get('users', opp.owner_user_id)
                const index = STAGES.indexOf(opp.stage)
                return (
                  <article
                    key={opp.opportunity_id}
                    className={`deal${dragId === opp.opportunity_id ? ' is-dragging' : ''}`}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/plain', String(opp.opportunity_id))
                      event.dataTransfer.effectAllowed = 'move'
                      setDragId(opp.opportunity_id)
                    }}
                    onDragEnd={() => {
                      setDragId(null)
                      setOverStage(null)
                    }}
                  >
                    <button type="button" className="deal__open" onClick={() => onOpen(opp)}>
                      <span className="deal__title">{opp.title}</span>
                      <span className="deal__account">{account ? account.account_name : 'No account'}</span>
                      <span className="deal__amount">{formatMoney(opp.amount)}</span>
                    </button>
                    <div className="deal__foot">
                      <span className="deal__date">{opp.close_date ? `Closes ${formatShortDate(opp.close_date)}` : 'No close date'}</span>
                      {owner ? <Avatar name={owner.full_name} size={22} /> : null}
                      <span className="deal__move">
                        <button
                          type="button"
                          aria-label={index > 0 ? `Move to ${STAGES[index - 1]}` : 'Already in the first stage'}
                          disabled={index === 0}
                          onClick={() => onMove(opp.opportunity_id, STAGES[index - 1])}
                        >
                          <LuChevronLeft aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={index < STAGES.length - 1 ? `Move to ${STAGES[index + 1]}` : 'Already in the last stage'}
                          disabled={index === STAGES.length - 1}
                          onClick={() => onMove(opp.opportunity_id, STAGES[index + 1])}
                        >
                          <LuChevronRight aria-hidden="true" />
                        </button>
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default function Opportunities() {
  const { data, get, update } = useCrm()
  const { openForm, askDelete, openDetail } = useDialogs()
  const toast = useToast()

  const [view, setView] = useState('board')
  const [query, setQuery] = useState('')
  const [owner, setOwner] = useState('all')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.opportunities.filter((opp) => {
      if (owner === 'none' && opp.owner_user_id != null) return false
      if (owner !== 'all' && owner !== 'none' && String(opp.owner_user_id) !== owner) return false
      if (!q) return true
      const account = get('accounts', opp.account_id)
      return [opp.title, account?.account_name].filter(Boolean).join(' ').toLowerCase().includes(q)
    })
  }, [data.opportunities, owner, query, get])

  function moveTo(id, stage) {
    const opp = get('opportunities', id)
    if (!opp || opp.stage === stage) return
    update('opportunities', id, { stage })
    toast(`Moved to ${stage}`)
  }

  const columns = [
    {
      key: 'title',
      header: 'Opportunity',
      sortValue: (opp) => opp.title,
      render: (opp) => (
        <div className="stack">
          <strong>{opp.title}</strong>
          <span className="muted">{get('accounts', opp.account_id)?.account_name ?? 'No account'}</span>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Stage',
      sortValue: (opp) => STAGES.indexOf(opp.stage),
      render: (opp) => <StatusBadge kind="stage" value={opp.stage} />,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortValue: (opp) => Number(opp.amount),
      render: (opp) => <span className="num">{formatMoney(opp.amount)}</span>,
    },
    {
      key: 'close',
      header: 'Expected close',
      sortValue: (opp) => opp.close_date,
      render: (opp) => formatDate(opp.close_date),
    },
    {
      key: 'owner',
      header: 'Owner',
      sortValue: (opp) => get('users', opp.owner_user_id)?.full_name ?? null,
      render: (opp) => <UserChip user={get('users', opp.owner_user_id)} empty="No owner" />,
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      render: (opp) => (
        <div className="row-actions">
          <IconButton label={`Edit ${opp.title}`} onClick={() => openForm('opportunities', { record: opp })}>
            <LuPencil aria-hidden="true" />
          </IconButton>
          <IconButton label={`Delete ${opp.title}`} tone="danger" onClick={() => askDelete('opportunities', opp.opportunity_id)}>
            <LuTrash2 aria-hidden="true" />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Opportunities" description="Deals in progress. Drag a card to another stage to update it.">
        <button type="button" className="btn btn--primary" onClick={() => openForm('opportunities')}>
          <LuPlus aria-hidden="true" /> Add opportunity
        </button>
      </PageHeader>

      <div className="toolbar">
        <SearchInput value={query} onChange={setQuery} placeholder="Search title or account" />
        <SelectFilter
          label="Owner"
          value={owner}
          onChange={setOwner}
          allLabel="Everyone"
          options={[
            { value: 'none', label: 'No owner' },
            ...data.users.map((user) => ({ value: String(user.user_id), label: user.full_name })),
          ]}
        />
        <div className="segmented" role="group" aria-label="View">
          <button type="button" className={view === 'board' ? 'is-active' : ''} aria-pressed={view === 'board'} onClick={() => setView('board')}>
            <LuLayoutGrid aria-hidden="true" /> Board
          </button>
          <button type="button" className={view === 'table' ? 'is-active' : ''} aria-pressed={view === 'table'} onClick={() => setView('table')}>
            <LuList aria-hidden="true" /> Table
          </button>
        </div>
      </div>

      {view === 'board' ? (
        <Board
          opportunities={rows}
          get={get}
          onOpen={(opp) => openDetail('opportunities', opp.opportunity_id)}
          onMove={moveTo}
        />
      ) : (
        <DataTable
          caption="Opportunities"
          columns={columns}
          rows={rows}
          rowKey={(opp) => opp.opportunity_id}
          onRowClick={(opp) => openDetail('opportunities', opp.opportunity_id)}
          defaultSort={{ key: 'close', dir: 'asc' }}
          empty={{ title: 'No opportunities match these filters', description: 'Clear the search or choose another owner.' }}
        />
      )}
    </>
  )
}
