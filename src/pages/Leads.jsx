import { useMemo, useState } from 'react'
import { LuPencil, LuPlus, LuTrash2, LuUserCheck } from 'react-icons/lu'
import PageHeader from '../components/PageHeader.jsx'
import DataTable from '../components/DataTable.jsx'
import IconButton from '../components/IconButton.jsx'
import { PersonCell, UserChip } from '../components/Avatar.jsx'
import { StatusBadge } from '../components/Badge.jsx'
import { FilterTabs, SearchInput, SelectFilter } from '../components/Toolbar.jsx'
import { useToast } from '../components/Toast.jsx'
import { useCrm } from '../context/CrmContext.jsx'
import { useDialogs } from '../context/dialogContext.js'
import { ENUMS } from '../config/schema.js'
import { formatDate, fullName } from '../utils/format.js'

export default function Leads() {
  const { data, get, convertLead } = useCrm()
  const { openForm, askDelete, openDetail } = useDialogs()
  const toast = useToast()

  const [status, setStatus] = useState('All')
  const [owner, setOwner] = useState('all')
  const [query, setQuery] = useState('')

  const tabs = useMemo(
    () => [
      { value: 'All', label: 'All', count: data.leads.length },
      ...ENUMS.leadStatus.map((value) => ({
        value,
        label: value,
        count: data.leads.filter((lead) => lead.status === value).length,
      })),
    ],
    [data.leads],
  )

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.leads.filter((lead) => {
      if (status !== 'All' && lead.status !== status) return false
      if (owner === 'none' && lead.assigned_user_id != null) return false
      if (owner !== 'all' && owner !== 'none' && String(lead.assigned_user_id) !== owner) return false
      if (!q) return true
      return [lead.first_name, lead.last_name, lead.company_name, lead.email, lead.phone]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [data.leads, status, owner, query])

  const columns = [
    {
      key: 'name',
      header: 'Lead',
      sortValue: (lead) => fullName(lead),
      render: (lead) => <PersonCell name={fullName(lead)} sub={lead.company_name || 'No company'} />,
    },
    {
      key: 'contact',
      header: 'Email and phone',
      render: (lead) => (
        <div className="stack">
          <span>{lead.email}</span>
          <span className="muted">{lead.phone || 'No phone'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (lead) => ENUMS.leadStatus.indexOf(lead.status),
      render: (lead) => <StatusBadge kind="lead" value={lead.status} />,
    },
    {
      key: 'owner',
      header: 'Assigned to',
      sortValue: (lead) => get('users', lead.assigned_user_id)?.full_name ?? null,
      render: (lead) => <UserChip user={get('users', lead.assigned_user_id)} />,
    },
    {
      key: 'created',
      header: 'Created',
      sortValue: (lead) => new Date(lead.created_at).getTime(),
      render: (lead) => formatDate(lead.created_at),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      render: (lead) => (
        <div className="row-actions">
          {lead.status !== 'Converted' ? (
            <IconButton
              label={`Convert ${fullName(lead)} to an account`}
              onClick={() => {
                convertLead(lead.lead_id)
                toast('Lead converted to an account and a contact')
              }}
            >
              <LuUserCheck aria-hidden="true" />
            </IconButton>
          ) : null}
          <IconButton label={`Edit ${fullName(lead)}`} onClick={() => openForm('leads', { record: lead })}>
            <LuPencil aria-hidden="true" />
          </IconButton>
          <IconButton label={`Delete ${fullName(lead)}`} tone="danger" onClick={() => askDelete('leads', lead.lead_id)}>
            <LuTrash2 aria-hidden="true" />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Leads" description="People and companies that might become customers.">
        <button type="button" className="btn btn--primary" onClick={() => openForm('leads')}>
          <LuPlus aria-hidden="true" /> Add lead
        </button>
      </PageHeader>

      <FilterTabs tabs={tabs} value={status} onChange={setStatus} />

      <div className="toolbar">
        <SearchInput value={query} onChange={setQuery} placeholder="Search name, company, email or phone" />
        <SelectFilter
          label="Assigned to"
          value={owner}
          onChange={setOwner}
          allLabel="Everyone"
          options={[
            { value: 'none', label: 'Unassigned' },
            ...data.users.map((user) => ({ value: String(user.user_id), label: user.full_name })),
          ]}
        />
      </div>

      <DataTable
        caption="Leads"
        columns={columns}
        rows={rows}
        rowKey={(lead) => lead.lead_id}
        onRowClick={(lead) => openDetail('leads', lead.lead_id)}
        defaultSort={{ key: 'created', dir: 'desc' }}
        empty={{
          title: 'No leads match these filters',
          description: 'Clear the search or pick a different status to see more leads.',
          action: (
            <button type="button" className="btn btn--secondary" onClick={() => openForm('leads')}>
              Add lead
            </button>
          ),
        }}
      />
    </>
  )
}
