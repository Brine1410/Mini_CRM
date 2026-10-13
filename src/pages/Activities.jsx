import { useMemo, useState } from 'react'
import { LuCircle, LuCircleCheck, LuContact, LuLifeBuoy, LuPencil, LuPlus, LuTarget, LuTrash2, LuUserPlus } from 'react-icons/lu'
import PageHeader from '../components/PageHeader.jsx'
import DataTable from '../components/DataTable.jsx'
import IconButton from '../components/IconButton.jsx'
import { UserChip } from '../components/Avatar.jsx'
import { StatusBadge } from '../components/Badge.jsx'
import { FilterTabs, SearchInput, SelectFilter } from '../components/Toolbar.jsx'
import { useToast } from '../components/Toast.jsx'
import { useCrm } from '../context/CrmContext.jsx'
import { useDialogs } from '../context/dialogContext.js'
import { ENUMS } from '../config/schema.js'
import { ACTIVITY_ICONS } from '../config/tones.js'
import { formatDateTime, fullName, isOverdue, relativeDay, toDate } from '../utils/format.js'

export default function Activities() {
  const { data, get, update } = useCrm()
  const { openForm, askDelete, openDetail } = useDialogs()
  const toast = useToast()

  const [status, setStatus] = useState('Pending')
  const [type, setType] = useState('all')
  const [person, setPerson] = useState('all')
  const [query, setQuery] = useState('')

  const tabs = useMemo(
    () => [
      { value: 'All', label: 'All', count: data.activities.length },
      ...ENUMS.activityStatus.map((value) => ({
        value,
        label: value,
        count: data.activities.filter((activity) => activity.status === value).length,
      })),
    ],
    [data.activities],
  )

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.activities.filter((activity) => {
      if (status !== 'All' && activity.status !== status) return false
      if (type !== 'all' && activity.type !== type) return false
      if (person !== 'all' && String(activity.performed_by_user_id) !== person) return false
      if (!q) return true
      return [activity.subject, activity.description].filter(Boolean).join(' ').toLowerCase().includes(q)
    })
  }, [data.activities, status, type, person, query])

  function toggleDone(activity) {
    if (activity.status === 'Pending') {
      update('activities', activity.activity_id, { status: 'Completed' })
      toast('Marked as completed')
    } else if (activity.status === 'Completed') {
      update('activities', activity.activity_id, { status: 'Pending' })
      toast('Moved back to pending')
    }
  }

  /** The records an activity is linked to (any of lead, contact, opportunity, ticket). */
  function relatedChips(activity) {
    const chips = []
    const lead = get('leads', activity.lead_id)
    const contact = get('contacts', activity.contact_id)
    const opp = get('opportunities', activity.opportunity_id)
    const ticket = get('tickets', activity.ticket_id)
    if (lead) chips.push({ key: 'lead', Icon: LuUserPlus, label: fullName(lead), open: () => openDetail('leads', lead.lead_id) })
    if (contact) chips.push({ key: 'contact', Icon: LuContact, label: fullName(contact), open: () => openDetail('contacts', contact.contact_id) })
    if (opp) chips.push({ key: 'opp', Icon: LuTarget, label: opp.title, open: () => openDetail('opportunities', opp.opportunity_id) })
    if (ticket) chips.push({ key: 'ticket', Icon: LuLifeBuoy, label: `#${ticket.ticket_id} ${ticket.subject}`, open: () => openDetail('tickets', ticket.ticket_id) })
    return chips
  }

  const columns = [
    {
      key: 'done',
      header: <span className="sr-only">Complete</span>,
      render: (activity) => {
        const done = activity.status === 'Completed'
        const locked = activity.status === 'Cancelled'
        return (
          <IconButton
            label={locked ? 'Cancelled activities cannot be completed' : done ? 'Move back to pending' : 'Mark as completed'}
            disabled={locked}
            tone={done ? 'success' : undefined}
            onClick={() => toggleDone(activity)}
          >
            {done ? <LuCircleCheck aria-hidden="true" /> : <LuCircle aria-hidden="true" />}
          </IconButton>
        )
      },
    },
    {
      key: 'subject',
      header: 'Activity',
      sortValue: (activity) => activity.subject,
      render: (activity) => {
        const Icon = ACTIVITY_ICONS[activity.type]
        return (
          <div className="activity-cell">
            <span className={`type-icon type-icon--${activity.type.toLowerCase()}`} title={activity.type}>
              <Icon aria-hidden="true" />
              <span className="sr-only">{activity.type}</span>
            </span>
            <div className="stack">
              <strong className={activity.status === 'Completed' ? 'is-done' : undefined}>{activity.subject}</strong>
              {activity.description ? <span className="muted clamp">{activity.description}</span> : null}
            </div>
          </div>
        )
      },
    },
    {
      key: 'related',
      header: 'Related to',
      render: (activity) => {
        const chips = relatedChips(activity)
        if (chips.length === 0) return <span className="muted">Nothing linked</span>
        return (
          <div className="chips">
            {chips.map(({ key, Icon, label, open }) => (
              <button
                key={key}
                type="button"
                className="chip"
                onClick={(event) => {
                  event.stopPropagation()
                  open()
                }}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        )
      },
    },
    {
      key: 'due',
      header: 'Due',
      sortValue: (activity) => (activity.due_date ? toDate(activity.due_date).getTime() : null),
      render: (activity) => {
        if (!activity.due_date) return <span className="muted">No due date</span>
        const overdue = isOverdue(activity)
        return (
          <div className={`stack${overdue ? ' is-overdue' : ''}`}>
            <span>{overdue ? 'Overdue' : relativeDay(activity.due_date)}</span>
            <span className={overdue ? '' : 'muted'}>{formatDateTime(activity.due_date)}</span>
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (activity) => ENUMS.activityStatus.indexOf(activity.status),
      render: (activity) => <StatusBadge kind="activity" value={activity.status} />,
    },
    {
      key: 'by',
      header: 'Performed by',
      sortValue: (activity) => get('users', activity.performed_by_user_id)?.full_name ?? null,
      render: (activity) => <UserChip user={get('users', activity.performed_by_user_id)} />,
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      render: (activity) => (
        <div className="row-actions">
          <IconButton label={`Edit ${activity.subject}`} onClick={() => openForm('activities', { record: activity })}>
            <LuPencil aria-hidden="true" />
          </IconButton>
          <IconButton label={`Delete ${activity.subject}`} tone="danger" onClick={() => askDelete('activities', activity.activity_id)}>
            <LuTrash2 aria-hidden="true" />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Activities" description="Calls, meetings, emails, tasks and notes across leads, contacts, deals and tickets.">
        <button type="button" className="btn btn--primary" onClick={() => openForm('activities')}>
          <LuPlus aria-hidden="true" /> Add activity
        </button>
      </PageHeader>

      <FilterTabs tabs={tabs} value={status} onChange={setStatus} />

      <div className="toolbar">
        <SearchInput value={query} onChange={setQuery} placeholder="Search subject or notes" />
        <SelectFilter
          label="Type"
          value={type}
          onChange={setType}
          allLabel="All types"
          options={ENUMS.activityType.map((value) => ({ value, label: value }))}
        />
        <SelectFilter
          label="Performed by"
          value={person}
          onChange={setPerson}
          allLabel="Everyone"
          options={data.users.map((user) => ({ value: String(user.user_id), label: user.full_name }))}
        />
      </div>

      <DataTable
        caption="Activities"
        columns={columns}
        rows={rows}
        rowKey={(activity) => activity.activity_id}
        onRowClick={(activity) => openForm('activities', { record: activity })}
        defaultSort={{ key: 'due', dir: 'asc' }}
        empty={{
          title: 'No activities match these filters',
          description: 'Log a call, meeting, email, task or note to keep the team in sync.',
          action: (
            <button type="button" className="btn btn--secondary" onClick={() => openForm('activities')}>
              Add activity
            </button>
          ),
        }}
      />
    </>
  )
}
