import { useMemo, useState } from 'react'
import { LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu'
import PageHeader from '../components/PageHeader.jsx'
import DataTable from '../components/DataTable.jsx'
import IconButton from '../components/IconButton.jsx'
import { PersonCell } from '../components/Avatar.jsx'
import { StatusBadge } from '../components/Badge.jsx'
import { FilterTabs, SearchInput } from '../components/Toolbar.jsx'
import { useCrm } from '../context/CrmContext.jsx'
import { useDialogs } from '../context/dialogContext.js'
import { ENUMS, OPEN_STAGES, OPEN_TICKET_STATUSES } from '../config/schema.js'
import { formatDate } from '../utils/format.js'

export default function Team() {
  const { data, currentUser } = useCrm()
  const { openForm, askDelete } = useDialogs()

  const [role, setRole] = useState('All')
  const [query, setQuery] = useState('')

  const tabs = useMemo(
    () => [
      { value: 'All', label: 'Everyone', count: data.users.length },
      ...ENUMS.userRole.map((value) => ({
        value,
        label: value,
        count: data.users.filter((user) => user.role === value).length,
      })),
    ],
    [data.users],
  )

  // Workload per person: what each team member currently owns
  const workload = useMemo(() => {
    const result = new Map()
    for (const user of data.users) result.set(user.user_id, { leads: 0, accounts: 0, deals: 0, tickets: 0 })
    for (const lead of data.leads) {
      if (result.has(lead.assigned_user_id) && lead.status !== 'Converted' && lead.status !== 'Unqualified') {
        result.get(lead.assigned_user_id).leads += 1
      }
    }
    for (const account of data.accounts) {
      if (result.has(account.owner_user_id)) result.get(account.owner_user_id).accounts += 1
    }
    for (const opp of data.opportunities) {
      if (result.has(opp.owner_user_id) && OPEN_STAGES.includes(opp.stage)) result.get(opp.owner_user_id).deals += 1
    }
    for (const ticket of data.tickets) {
      if (result.has(ticket.assigned_user_id) && OPEN_TICKET_STATUSES.includes(ticket.status)) {
        result.get(ticket.assigned_user_id).tickets += 1
      }
    }
    return result
  }, [data])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.users.filter((user) => {
      if (role !== 'All' && user.role !== role) return false
      if (!q) return true
      return `${user.full_name} ${user.email}`.toLowerCase().includes(q)
    })
  }, [data.users, role, query])

  const columns = [
    {
      key: 'name',
      header: 'Team member',
      sortValue: (user) => user.full_name,
      render: (user) => <PersonCell name={user.full_name} sub={user.email} />,
    },
    {
      key: 'role',
      header: 'Role',
      sortValue: (user) => user.role,
      render: (user) => <StatusBadge kind="role" value={user.role} />,
    },
    {
      key: 'leads',
      header: 'Active leads',
      align: 'right',
      sortValue: (user) => workload.get(user.user_id)?.leads ?? 0,
      render: (user) => <span className="num">{workload.get(user.user_id)?.leads ?? 0}</span>,
    },
    {
      key: 'accounts',
      header: 'Accounts',
      align: 'right',
      sortValue: (user) => workload.get(user.user_id)?.accounts ?? 0,
      render: (user) => <span className="num">{workload.get(user.user_id)?.accounts ?? 0}</span>,
    },
    {
      key: 'deals',
      header: 'Open deals',
      align: 'right',
      sortValue: (user) => workload.get(user.user_id)?.deals ?? 0,
      render: (user) => <span className="num">{workload.get(user.user_id)?.deals ?? 0}</span>,
    },
    {
      key: 'tickets',
      header: 'Open tickets',
      align: 'right',
      sortValue: (user) => workload.get(user.user_id)?.tickets ?? 0,
      render: (user) => <span className="num">{workload.get(user.user_id)?.tickets ?? 0}</span>,
    },
    {
      key: 'created',
      header: 'Joined',
      sortValue: (user) => new Date(user.created_at).getTime(),
      render: (user) => formatDate(user.created_at),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      render: (user) => {
        const isYou = currentUser && user.user_id === currentUser.user_id
        return (
          <div className="row-actions">
            <IconButton label={`Edit ${user.full_name}`} onClick={() => openForm('users', { record: user })}>
              <LuPencil aria-hidden="true" />
            </IconButton>
            <IconButton
              label={isYou ? 'You cannot delete the account you are signed in with' : `Delete ${user.full_name}`}
              tone="danger"
              disabled={isYou}
              onClick={() => askDelete('users', user.user_id)}
            >
              <LuTrash2 aria-hidden="true" />
            </IconButton>
          </div>
        )
      },
    },
  ]

  return (
    <>
      <PageHeader title="Team" description="Everyone who can own leads, accounts, deals, tickets and activities.">
        <button type="button" className="btn btn--primary" onClick={() => openForm('users')}>
          <LuPlus aria-hidden="true" /> Add team member
        </button>
      </PageHeader>

      <FilterTabs tabs={tabs} value={role} onChange={setRole} label="Filter by role" />

      <div className="toolbar">
        <SearchInput value={query} onChange={setQuery} placeholder="Search name or email" />
      </div>

      <DataTable
        caption="Team members"
        columns={columns}
        rows={rows}
        rowKey={(user) => user.user_id}
        onRowClick={(user) => openForm('users', { record: user })}
        defaultSort={{ key: 'name', dir: 'asc' }}
        empty={{ title: 'No team members match these filters', description: 'Clear the search or pick another role.' }}
      />
    </>
  )
}
