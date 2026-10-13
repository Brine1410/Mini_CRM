import { useMemo, useState } from 'react'
import { LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu'
import PageHeader from '../components/PageHeader.jsx'
import DataTable from '../components/DataTable.jsx'
import IconButton from '../components/IconButton.jsx'
import { UserChip } from '../components/Avatar.jsx'
import { StatusBadge } from '../components/Badge.jsx'
import { FilterTabs, SearchInput, SelectFilter } from '../components/Toolbar.jsx'
import { useCrm } from '../context/CrmContext.jsx'
import { useDialogs } from '../context/dialogContext.js'
import { ENUMS } from '../config/schema.js'
import { PRIORITY_RANK } from '../config/tones.js'
import { formatDate, fullName } from '../utils/format.js'

export default function Tickets() {
  const { data, get } = useCrm()
  const { openForm, askDelete, openDetail } = useDialogs()

  const [status, setStatus] = useState('All')
  const [priority, setPriority] = useState('all')
  const [assignee, setAssignee] = useState('all')
  const [query, setQuery] = useState('')

  const tabs = useMemo(
    () => [
      { value: 'All', label: 'All', count: data.tickets.length },
      ...ENUMS.ticketStatus.map((value) => ({
        value,
        label: value,
        count: data.tickets.filter((ticket) => ticket.status === value).length,
      })),
    ],
    [data.tickets],
  )

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.tickets.filter((ticket) => {
      if (status !== 'All' && ticket.status !== status) return false
      if (priority !== 'all' && ticket.priority !== priority) return false
      if (assignee === 'none' && ticket.assigned_user_id != null) return false
      if (assignee !== 'all' && assignee !== 'none' && String(ticket.assigned_user_id) !== assignee) return false
      if (!q) return true
      const contact = get('contacts', ticket.contact_id)
      const account = get('accounts', ticket.account_id)
      return [ticket.subject, `#${ticket.ticket_id}`, contact ? fullName(contact) : '', account?.account_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [data.tickets, status, priority, assignee, query, get])

  const columns = [
    {
      key: 'subject',
      header: 'Ticket',
      sortValue: (ticket) => ticket.subject,
      render: (ticket) => {
        const contact = get('contacts', ticket.contact_id)
        return (
          <div className="stack">
            <strong>{ticket.subject}</strong>
            <span className="muted">
              #{ticket.ticket_id}, raised by {contact ? fullName(contact) : 'unknown contact'}
            </span>
          </div>
        )
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      sortValue: (ticket) => PRIORITY_RANK[ticket.priority],
      render: (ticket) => <StatusBadge kind="priority" value={ticket.priority} />,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (ticket) => ENUMS.ticketStatus.indexOf(ticket.status),
      render: (ticket) => <StatusBadge kind="ticket" value={ticket.status} />,
    },
    {
      key: 'account',
      header: 'Account',
      sortValue: (ticket) => get('accounts', ticket.account_id)?.account_name ?? null,
      render: (ticket) => get('accounts', ticket.account_id)?.account_name ?? <span className="muted">No account</span>,
    },
    {
      key: 'assignee',
      header: 'Assigned to',
      sortValue: (ticket) => get('users', ticket.assigned_user_id)?.full_name ?? null,
      render: (ticket) => <UserChip user={get('users', ticket.assigned_user_id)} />,
    },
    {
      key: 'created',
      header: 'Created',
      sortValue: (ticket) => new Date(ticket.created_at).getTime(),
      render: (ticket) => formatDate(ticket.created_at),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      render: (ticket) => (
        <div className="row-actions">
          <IconButton label={`Edit ticket ${ticket.ticket_id}`} onClick={() => openForm('tickets', { record: ticket })}>
            <LuPencil aria-hidden="true" />
          </IconButton>
          <IconButton label={`Delete ticket ${ticket.ticket_id}`} tone="danger" onClick={() => askDelete('tickets', ticket.ticket_id)}>
            <LuTrash2 aria-hidden="true" />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Tickets" description="Support requests from your contacts, from first report to resolution.">
        <button type="button" className="btn btn--primary" onClick={() => openForm('tickets')}>
          <LuPlus aria-hidden="true" /> Add ticket
        </button>
      </PageHeader>

      <FilterTabs tabs={tabs} value={status} onChange={setStatus} />

      <div className="toolbar">
        <SearchInput value={query} onChange={setQuery} placeholder="Search subject, contact, account or #id" />
        <SelectFilter
          label="Priority"
          value={priority}
          onChange={setPriority}
          allLabel="All priorities"
          options={[...ENUMS.ticketPriority].reverse().map((value) => ({ value, label: value }))}
        />
        <SelectFilter
          label="Assigned to"
          value={assignee}
          onChange={setAssignee}
          allLabel="Everyone"
          options={[
            { value: 'none', label: 'Unassigned' },
            ...data.users.map((user) => ({ value: String(user.user_id), label: user.full_name })),
          ]}
        />
      </div>

      <DataTable
        caption="Tickets"
        columns={columns}
        rows={rows}
        rowKey={(ticket) => ticket.ticket_id}
        onRowClick={(ticket) => openDetail('tickets', ticket.ticket_id)}
        defaultSort={{ key: 'created', dir: 'desc' }}
        empty={{
          title: 'No tickets match these filters',
          description: 'Clear the search or choose another status, priority or assignee.',
        }}
      />
    </>
  )
}
