import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu'
import PageHeader from '../components/PageHeader.jsx'
import DataTable from '../components/DataTable.jsx'
import IconButton from '../components/IconButton.jsx'
import { PersonCell, UserChip } from '../components/Avatar.jsx'
import { SearchInput, SelectFilter } from '../components/Toolbar.jsx'
import { useCrm } from '../context/CrmContext.jsx'
import { useDialogs } from '../context/dialogContext.js'
import { OPEN_STAGES } from '../config/schema.js'
import { displayUrl, formatDate, formatMoney } from '../utils/format.js'

export default function Accounts() {
  const { data, get } = useCrm()
  const { openForm, askDelete } = useDialogs()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [owner, setOwner] = useState('all')
  const [industry, setIndustry] = useState('all')

  const industries = useMemo(
    () => [...new Set(data.accounts.map((account) => account.industry).filter(Boolean))].sort(),
    [data.accounts],
  )

  // How many contacts and open opportunities each account has
  const counts = useMemo(() => {
    const result = new Map()
    for (const account of data.accounts) result.set(account.account_id, { contacts: 0, deals: 0 })
    for (const contact of data.contacts) {
      if (result.has(contact.account_id)) result.get(contact.account_id).contacts += 1
    }
    for (const opp of data.opportunities) {
      if (result.has(opp.account_id) && OPEN_STAGES.includes(opp.stage)) result.get(opp.account_id).deals += 1
    }
    return result
  }, [data.accounts, data.contacts, data.opportunities])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.accounts.filter((account) => {
      if (industry !== 'all' && account.industry !== industry) return false
      if (owner === 'none' && account.owner_user_id != null) return false
      if (owner !== 'all' && owner !== 'none' && String(account.owner_user_id) !== owner) return false
      if (!q) return true
      return [account.account_name, account.industry, account.website].filter(Boolean).join(' ').toLowerCase().includes(q)
    })
  }, [data.accounts, industry, owner, query])

  const columns = [
    {
      key: 'name',
      header: 'Account',
      sortValue: (account) => account.account_name,
      render: (account) => (
        <PersonCell
          name={account.account_name}
          sub={account.website ? displayUrl(account.website) : 'No website'}
        />
      ),
    },
    {
      key: 'industry',
      header: 'Industry',
      sortValue: (account) => account.industry,
      render: (account) => account.industry || <span className="muted">Not set</span>,
    },
    {
      key: 'revenue',
      header: 'Annual revenue',
      align: 'right',
      sortValue: (account) => (account.annual_revenue == null ? null : Number(account.annual_revenue)),
      render: (account) => <span className="num">{formatMoney(account.annual_revenue)}</span>,
    },
    {
      key: 'contacts',
      header: 'Contacts',
      align: 'right',
      sortValue: (account) => counts.get(account.account_id)?.contacts ?? 0,
      render: (account) => <span className="num">{counts.get(account.account_id)?.contacts ?? 0}</span>,
    },
    {
      key: 'deals',
      header: 'Open deals',
      align: 'right',
      sortValue: (account) => counts.get(account.account_id)?.deals ?? 0,
      render: (account) => <span className="num">{counts.get(account.account_id)?.deals ?? 0}</span>,
    },
    {
      key: 'owner',
      header: 'Owner',
      sortValue: (account) => get('users', account.owner_user_id)?.full_name ?? null,
      render: (account) => <UserChip user={get('users', account.owner_user_id)} empty="No owner" />,
    },
    {
      key: 'created',
      header: 'Created',
      sortValue: (account) => new Date(account.created_at).getTime(),
      render: (account) => formatDate(account.created_at),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      render: (account) => (
        <div className="row-actions">
          <IconButton label={`Edit ${account.account_name}`} onClick={() => openForm('accounts', { record: account })}>
            <LuPencil aria-hidden="true" />
          </IconButton>
          <IconButton
            label={`Delete ${account.account_name}`}
            tone="danger"
            onClick={() => askDelete('accounts', account.account_id)}
          >
            <LuTrash2 aria-hidden="true" />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Accounts" description="Companies you sell to and support. Open one to see its contacts, deals and tickets.">
        <button type="button" className="btn btn--primary" onClick={() => openForm('accounts')}>
          <LuPlus aria-hidden="true" /> Add account
        </button>
      </PageHeader>

      <div className="toolbar">
        <SearchInput value={query} onChange={setQuery} placeholder="Search name, industry or website" />
        <SelectFilter
          label="Industry"
          value={industry}
          onChange={setIndustry}
          allLabel="All industries"
          options={industries.map((name) => ({ value: name, label: name }))}
        />
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
      </div>

      <DataTable
        caption="Accounts"
        columns={columns}
        rows={rows}
        rowKey={(account) => account.account_id}
        onRowClick={(account) => navigate(`/accounts/${account.account_id}`)}
        defaultSort={{ key: 'created', dir: 'desc' }}
        empty={{
          title: 'No accounts match these filters',
          description: 'Clear the search or choose another industry or owner.',
        }}
      />
    </>
  )
}
