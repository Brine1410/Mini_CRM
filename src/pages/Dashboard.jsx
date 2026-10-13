import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import { StatusBadge } from '../components/Badge.jsx'
import { useCrm } from '../context/CrmContext.jsx'
import { useDialogs } from '../context/dialogContext.js'
import { ENUMS, OPEN_STAGES, OPEN_TICKET_STATUSES } from '../config/schema.js'
import { ACTIVITY_ICONS, LEAD_COLORS, PRIORITY_COLORS, PRIORITY_RANK, STAGE_COLORS } from '../config/tones.js'
import { formatCompactMoney, formatDateTime, fullName, isOverdue, relativeDay, toDate } from '../utils/format.js'

const sum = (rows, field) => rows.reduce((total, row) => total + Number(row[field] || 0), 0)

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function Panel({ title, to, linkLabel, children }) {
  return (
    <section className="panel dash-panel">
      <header className="dash-panel__head">
        <h2>{title}</h2>
        {to ? <Link to={to}>{linkLabel}</Link> : null}
      </header>
      {children}
    </section>
  )
}

export default function Dashboard() {
  const { data, get, currentUser } = useCrm()
  const { openForm, openDetail } = useDialogs()

  const pipeline = useMemo(() => {
    const stages = ENUMS.oppStage.map((stage) => {
      const items = data.opportunities.filter((opp) => opp.stage === stage)
      return { stage, count: items.length, amount: sum(items, 'amount') }
    })
    const open = stages.filter((item) => OPEN_STAGES.includes(item.stage))
    const won = stages.find((item) => item.stage === 'Closed Won')
    const lost = stages.find((item) => item.stage === 'Closed Lost')
    const decided = won.count + lost.count
    return {
      stages,
      total: stages.reduce((value, item) => value + item.amount, 0),
      openValue: open.reduce((value, item) => value + item.amount, 0),
      openCount: open.reduce((value, item) => value + item.count, 0),
      wonValue: won.amount,
      winRate: decided ? Math.round((won.count / decided) * 100) : null,
    }
  }, [data.opportunities])

  const upNext = useMemo(
    () =>
      data.activities
        .filter((activity) => activity.status === 'Pending')
        .sort((a, b) => {
          const left = a.due_date ? toDate(a.due_date).getTime() : Infinity
          const right = b.due_date ? toDate(b.due_date).getTime() : Infinity
          return left - right
        })
        .slice(0, 6),
    [data.activities],
  )
  const overdueCount = useMemo(() => data.activities.filter(isOverdue).length, [data.activities])

  const tickets = useMemo(() => {
    const open = data.tickets.filter((ticket) => OPEN_TICKET_STATUSES.includes(ticket.status))
    const byPriority = [...ENUMS.ticketPriority].reverse().map((priority) => ({
      priority,
      count: open.filter((ticket) => ticket.priority === priority).length,
    }))
    const top = [...open]
      .sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] || a.ticket_id - b.ticket_id)
      .slice(0, 3)
    return { open, byPriority, top, max: Math.max(1, ...byPriority.map((item) => item.count)) }
  }, [data.tickets])

  const leads = useMemo(
    () => ENUMS.leadStatus.map((status) => ({ status, count: data.leads.filter((lead) => lead.status === status).length })),
    [data.leads],
  )

  const topDeals = useMemo(
    () =>
      data.opportunities
        .filter((opp) => OPEN_STAGES.includes(opp.stage))
        .sort((a, b) => Number(b.amount) - Number(a.amount))
        .slice(0, 5),
    [data.opportunities],
  )

  const firstName = currentUser ? currentUser.full_name.split(' ')[0] : 'there'

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description="Where your pipeline, support queue and follow-ups stand today."
      />

      {/* ------------------------------------------------ pipeline */}
      <section className="panel pipeline">
        <div className="pipeline__head">
          <div>
            <h2>Pipeline by stage</h2>
            <p className="muted">Total value of opportunities in each stage</p>
          </div>
          <dl className="pipeline__stats">
            <div>
              <dt>Open pipeline</dt>
              <dd>{formatCompactMoney(pipeline.openValue)}</dd>
            </div>
            <div>
              <dt>Won</dt>
              <dd>{formatCompactMoney(pipeline.wonValue)}</dd>
            </div>
            <div>
              <dt>Win rate</dt>
              <dd>{pipeline.winRate === null ? '—' : `${pipeline.winRate}%`}</dd>
            </div>
          </dl>
        </div>

        <div className="flow" aria-hidden="true">
          {pipeline.stages.map((item) => (
            <span
              key={item.stage}
              className="flow__seg"
              title={`${item.stage}: ${formatCompactMoney(item.amount)}`}
              style={{
                flexGrow: pipeline.total > 0 ? Math.max(item.amount, pipeline.total * 0.03) : 1,
                background: STAGE_COLORS[item.stage],
              }}
            />
          ))}
        </div>

        <ul className="flow-legend">
          {pipeline.stages.map((item) => (
            <li key={item.stage} style={{ '--stage-color': STAGE_COLORS[item.stage] }}>
              <span className="flow-legend__name">{item.stage}</span>
              <span className="flow-legend__amount">{formatCompactMoney(item.amount)}</span>
              <span className="muted">
                {item.count} {item.count === 1 ? 'deal' : 'deals'}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="dash-grid">
        {/* ------------------------------------------------ follow-ups */}
        <Panel title="Up next" to="/activities" linkLabel="All activities">
          {overdueCount > 0 ? (
            <p className="callout callout--alert">
              {overdueCount} pending {overdueCount === 1 ? 'activity is' : 'activities are'} past due.
            </p>
          ) : null}
          {upNext.length === 0 ? (
            <p className="muted dash-panel__empty">You are all caught up. New follow-ups will show up here.</p>
          ) : (
            <ul className="list">
              {upNext.map((activity) => {
                const Icon = ACTIVITY_ICONS[activity.type]
                const overdue = isOverdue(activity)
                const performer = get('users', activity.performed_by_user_id)
                return (
                  <li key={activity.activity_id}>
                    <button
                      type="button"
                      className="list__item"
                      onClick={() => openForm('activities', { record: activity })}
                    >
                      <span className={`type-icon type-icon--${activity.type.toLowerCase()}`}>
                        <Icon aria-hidden="true" />
                      </span>
                      <span className="list__text">
                        <span className="list__title">{activity.subject}</span>
                        <span className="list__sub">{performer ? performer.full_name : 'Unassigned'}</span>
                      </span>
                      <span className={`list__when${overdue ? ' is-overdue' : ''}`}>
                        {activity.due_date ? (overdue ? `Overdue, ${relativeDay(activity.due_date).toLowerCase()}` : relativeDay(activity.due_date)) : 'No due date'}
                        <small>{activity.due_date ? formatDateTime(activity.due_date) : ''}</small>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        {/* ------------------------------------------------ tickets */}
        <Panel title="Open tickets" to="/tickets" linkLabel="All tickets">
          <div className="bars" role="list">
            {tickets.byPriority.map((item) => (
              <div key={item.priority} className="bars__row" role="listitem">
                <span className="bars__label">{item.priority}</span>
                <span className="bars__track">
                  <span
                    className="bars__fill"
                    style={{ width: `${(item.count / tickets.max) * 100}%`, background: PRIORITY_COLORS[item.priority] }}
                  />
                </span>
                <span className="bars__value">{item.count}</span>
              </div>
            ))}
          </div>
          {tickets.top.length === 0 ? (
            <p className="muted dash-panel__empty">No open tickets right now.</p>
          ) : (
            <ul className="list list--spaced">
              {tickets.top.map((ticket) => {
                const contact = get('contacts', ticket.contact_id)
                return (
                  <li key={ticket.ticket_id}>
                    <button type="button" className="list__item" onClick={() => openDetail('tickets', ticket.ticket_id)}>
                      <span className="list__text">
                        <span className="list__title">{ticket.subject}</span>
                        <span className="list__sub">{contact ? fullName(contact) : ''}</span>
                      </span>
                      <StatusBadge kind="priority" value={ticket.priority} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        {/* ------------------------------------------------ leads */}
        <Panel title="Leads by status" to="/leads" linkLabel="All leads">
          <div className="flow flow--thin" aria-hidden="true">
            {leads.map((item) => (
              <span
                key={item.status}
                className="flow__seg"
                style={{ flexGrow: item.count, background: LEAD_COLORS[item.status], display: item.count ? 'block' : 'none' }}
              />
            ))}
          </div>
          <ul className="legend">
            {leads.map((item) => (
              <li key={item.status}>
                <span className="legend__dot" style={{ background: LEAD_COLORS[item.status] }} />
                <span>{item.status}</span>
                <strong>{item.count}</strong>
              </li>
            ))}
          </ul>
        </Panel>

        {/* ------------------------------------------------ deals */}
        <Panel title="Biggest open deals" to="/opportunities" linkLabel="Pipeline board">
          {topDeals.length === 0 ? (
            <p className="muted dash-panel__empty">No open opportunities yet.</p>
          ) : (
            <ul className="list">
              {topDeals.map((opp) => {
                const account = get('accounts', opp.account_id)
                return (
                  <li key={opp.opportunity_id}>
                    <button type="button" className="list__item" onClick={() => openDetail('opportunities', opp.opportunity_id)}>
                      <span className="list__text">
                        <span className="list__title">{opp.title}</span>
                        <span className="list__sub">{account ? account.account_name : ''}</span>
                      </span>
                      <StatusBadge kind="stage" value={opp.stage} />
                      <strong className="list__amount">{formatCompactMoney(opp.amount)}</strong>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}
