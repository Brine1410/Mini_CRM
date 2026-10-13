import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LuArrowLeft, LuGlobe, LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu'
import PageHeader from '../components/PageHeader.jsx'
import DataTable from '../components/DataTable.jsx'
import IconButton from '../components/IconButton.jsx'
import { PersonCell, UserChip } from '../components/Avatar.jsx'
import { StatusBadge } from '../components/Badge.jsx'
import { FilterTabs } from '../components/Toolbar.jsx'
import { useCrm } from '../context/CrmContext.jsx'
import { useDialogs } from '../context/dialogContext.js'
import { OPEN_STAGES, OPEN_TICKET_STATUSES } from '../config/schema.js'
import { PRIORITY_RANK } from '../config/tones.js'
import { displayUrl, formatDate, formatMoney, fullName, toHref } from '../utils/format.js'

export default function AccountDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, get } = useCrm()
  const { openForm, askDelete, openDetail } = useDialogs()
  const [tab, setTab] = useState('contacts')

  const accountId = Number(id)
  const account = get('accounts', accountId)

  // Unknown id, or the account was just deleted: go back to the list
  useEffect(() => {
    if (!account) navigate('/accounts', { replace: true })
  }, [account, navigate])

  const contacts = useMemo(() => data.contacts.filter((item) => item.account_id === accountId), [data.contacts, accountId])
  const opportunities = useMemo(
    () => data.opportunities.filter((item) => item.account_id === accountId),
    [data.opportunities, accountId],
  )
  const tickets = useMemo(() => data.tickets.filter((item) => item.account_id === accountId), [data.tickets, accountId])

  if (!account) return null

  const openPipeline = opportunities
    .filter((opp) => OPEN_STAGES.includes(opp.stage))
    .reduce((total, opp) => total + Number(opp.amount || 0), 0)
  const openTickets = tickets.filter((ticket) => OPEN_TICKET_STATUSES.includes(ticket.status)).length

  const tabs = [
    { value: 'contacts', label: 'Contacts', count: contacts.length },
    { value: 'opportunities', label: 'Opportunities', count: opportunities.length },
    { value: 'tickets', label: 'Tickets', count: tickets.length },
  ]

  const contactColumns = [
    {
      key: 'name',
      header: 'Contact',
      sortValue: (contact) => fullName(contact),
      render: (contact) => <PersonCell name={fullName(contact)} sub={contact.job_title || 'No job title'} />,
    },
    {
      key: 'reach',
      header: 'Email and phone',
      render: (contact) => (
        <div className="stack">
          <span>{contact.email}</span>
          <span className="muted">{contact.phone || 'No phone'}</span>
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (contact) => <UserChip user={get('users', contact.owner_user_id)} empty="No owner" />,
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      render: (contact) => (
        <div className="row-actions">
          <IconButton label={`Edit ${fullName(contact)}`} onClick={() => openForm('contacts', { record: contact })}>
            <LuPencil aria-hidden="true" />
          </IconButton>
          <IconButton label={`Delete ${fullName(contact)}`} tone="danger" onClick={() => askDelete('contacts', contact.contact_id)}>
            <LuTrash2 aria-hidden="true" />
          </IconButton>
        </div>
      ),
    },
  ]

  const opportunityColumns = [
    {
      key: 'title',
      header: 'Opportunity',
      sortValue: (opp) => opp.title,
      render: (opp) => <strong>{opp.title}</strong>,
    },
    { key: 'stage', header: 'Stage', render: (opp) => <StatusBadge kind="stage" value={opp.stage} /> },
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
    { key: 'owner', header: 'Owner', render: (opp) => <UserChip user={get('users', opp.owner_user_id)} empty="No owner" /> },
  ]

  const ticketColumns = [
    {
      key: 'subject',
      header: 'Ticket',
      render: (ticket) => (
        <div className="stack">
          <strong>{ticket.subject}</strong>
          <span className="muted">
            #{ticket.ticket_id}, {fullName(get('contacts', ticket.contact_id))}
          </span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortValue: (ticket) => PRIORITY_RANK[ticket.priority],
      render: (ticket) => <StatusBadge kind="priority" value={ticket.priority} />,
    },
    { key: 'status', header: 'Status', render: (ticket) => <StatusBadge kind="ticket" value={ticket.status} /> },
    { key: 'created', header: 'Created', render: (ticket) => formatDate(ticket.created_at) },
  ]

  const addLabel = { contacts: 'Add contact', opportunities: 'Add opportunity', tickets: 'Add ticket' }[tab]
  const addTable = tab

  return (
    <>
      <Link to="/accounts" className="back-link">
        <LuArrowLeft aria-hidden="true" /> All accounts
      </Link>

      <PageHeader
        title={account.account_name}
        description={account.industry ? `${account.industry} company` : 'Industry not set'}
      >
        <button type="button" className="btn btn--secondary" onClick={() => openForm('accounts', { record: account })}>
          <LuPencil aria-hidden="true" /> Edit
        </button>
        <button type="button" className="btn btn--danger-ghost" onClick={() => askDelete('accounts', accountId)}>
          <LuTrash2 aria-hidden="true" /> Delete
        </button>
      </PageHeader>

      <dl className="summary">
        <div>
          <dt>Annual revenue</dt>
          <dd>{formatMoney(account.annual_revenue)}</dd>
        </div>
        <div>
          <dt>Open pipeline</dt>
          <dd>{formatMoney(openPipeline)}</dd>
        </div>
        <div>
          <dt>Open tickets</dt>
          <dd>{openTickets}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd className="summary__owner">
            <UserChip user={get('users', account.owner_user_id)} empty="No owner" />
          </dd>
        </div>
        <div>
          <dt>Website</dt>
          <dd>
            {account.website ? (
              <a href={toHref(account.website)} target="_blank" rel="noreferrer" className="inline-link">
                <LuGlobe aria-hidden="true" /> {displayUrl(account.website)}
              </a>
            ) : (
              <span className="muted">Not set</span>
            )}
          </dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatDate(account.created_at)}</dd>
        </div>
      </dl>

      <div className="tab-bar">
        <FilterTabs tabs={tabs} value={tab} onChange={setTab} label="Related records" />
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => openForm(addTable, { defaults: { account_id: accountId } })}
        >
          <LuPlus aria-hidden="true" /> {addLabel}
        </button>
      </div>

      {tab === 'contacts' ? (
        <DataTable
          caption="Contacts at this account"
          columns={contactColumns}
          rows={contacts}
          rowKey={(row) => row.contact_id}
          onRowClick={(row) => openDetail('contacts', row.contact_id)}
          empty={{ title: 'No contacts yet', description: 'Add the people you work with at this company.' }}
        />
      ) : null}
      {tab === 'opportunities' ? (
        <DataTable
          caption="Opportunities for this account"
          columns={opportunityColumns}
          rows={opportunities}
          rowKey={(row) => row.opportunity_id}
          onRowClick={(row) => openDetail('opportunities', row.opportunity_id)}
          empty={{ title: 'No opportunities yet', description: 'Add a deal to start tracking revenue from this account.' }}
        />
      ) : null}
      {tab === 'tickets' ? (
        <DataTable
          caption="Support tickets for this account"
          columns={ticketColumns}
          rows={tickets}
          rowKey={(row) => row.ticket_id}
          onRowClick={(row) => openDetail('tickets', row.ticket_id)}
          empty={{ title: 'No tickets yet', description: 'Support requests from this company will appear here.' }}
        />
      ) : null}
    </>
  )
}
