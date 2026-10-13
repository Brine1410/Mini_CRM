import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu'
import PageHeader from '../components/PageHeader.jsx'
import DataTable from '../components/DataTable.jsx'
import IconButton from '../components/IconButton.jsx'
import { PersonCell, UserChip } from '../components/Avatar.jsx'
import { SearchInput, SelectFilter } from '../components/Toolbar.jsx'
import { useCrm } from '../context/CrmContext.jsx'
import { useDialogs } from '../context/dialogContext.js'
import { formatDate, fullName } from '../utils/format.js'

export default function Contacts() {
  const { data, get } = useCrm()
  const { openForm, askDelete, openDetail } = useDialogs()

  const [query, setQuery] = useState('')
  const [account, setAccount] = useState('all')
  const [owner, setOwner] = useState('all')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.contacts.filter((contact) => {
      if (account === 'none' && contact.account_id != null) return false
      if (account !== 'all' && account !== 'none' && String(contact.account_id) !== account) return false
      if (owner === 'none' && contact.owner_user_id != null) return false
      if (owner !== 'all' && owner !== 'none' && String(contact.owner_user_id) !== owner) return false
      if (!q) return true
      return [contact.first_name, contact.last_name, contact.email, contact.phone, contact.job_title]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [data.contacts, account, owner, query])

  const columns = [
    {
      key: 'name',
      header: 'Contact',
      sortValue: (contact) => fullName(contact),
      render: (contact) => <PersonCell name={fullName(contact)} sub={contact.job_title || 'No job title'} />,
    },
    {
      key: 'account',
      header: 'Account',
      sortValue: (contact) => get('accounts', contact.account_id)?.account_name ?? null,
      render: (contact) => {
        const found = get('accounts', contact.account_id)
        return found ? (
          <Link to={`/accounts/${found.account_id}`} onClick={(event) => event.stopPropagation()}>
            {found.account_name}
          </Link>
        ) : (
          <span className="muted">No account</span>
        )
      },
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
      sortValue: (contact) => get('users', contact.owner_user_id)?.full_name ?? null,
      render: (contact) => <UserChip user={get('users', contact.owner_user_id)} empty="No owner" />,
    },
    {
      key: 'created',
      header: 'Created',
      sortValue: (contact) => new Date(contact.created_at).getTime(),
      render: (contact) => formatDate(contact.created_at),
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

  return (
    <>
      <PageHeader title="Contacts" description="The people you talk to at your accounts.">
        <button type="button" className="btn btn--primary" onClick={() => openForm('contacts')}>
          <LuPlus aria-hidden="true" /> Add contact
        </button>
      </PageHeader>

      <div className="toolbar">
        <SearchInput value={query} onChange={setQuery} placeholder="Search name, email, phone or job title" />
        <SelectFilter
          label="Account"
          value={account}
          onChange={setAccount}
          allLabel="All accounts"
          options={[
            { value: 'none', label: 'No account' },
            ...data.accounts.map((item) => ({ value: String(item.account_id), label: item.account_name })),
          ]}
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
        caption="Contacts"
        columns={columns}
        rows={rows}
        rowKey={(contact) => contact.contact_id}
        onRowClick={(contact) => openDetail('contacts', contact.contact_id)}
        defaultSort={{ key: 'created', dir: 'desc' }}
        empty={{
          title: 'No contacts match these filters',
          description: 'Clear the search or choose another account or owner.',
        }}
      />
    </>
  )
}
