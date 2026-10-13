import { Link } from 'react-router-dom'
import { LuPencil, LuPlus, LuTrash2, LuUserCheck } from 'react-icons/lu'
import Drawer from './Drawer.jsx'
import { StatusBadge } from './Badge.jsx'
import { UserChip } from './Avatar.jsx'
import { useToast } from './Toast.jsx'
import { useCrm } from '../context/CrmContext.jsx'
import { useDialogs } from '../context/dialogContext.js'
import { ACTIVITY_ICONS } from '../config/tones.js'
import { formatDate, formatDateTime, formatMoney, fullName, isOverdue } from '../utils/format.js'

// Which activities column points at each table
const ACTIVITY_LINK = {
  leads: 'lead_id',
  contacts: 'contact_id',
  opportunities: 'opportunity_id',
  tickets: 'ticket_id',
}

function Row({ label, children }) {
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

const dash = <span className="muted">Not set</span>

function describe(table, record, get, close) {
  const account = get('accounts', record.account_id)
  const accountLink = account ? (
    <Link to={`/accounts/${account.account_id}`} onClick={close}>
      {account.account_name}
    </Link>
  ) : (
    dash
  )
  const mail = (email) => (email ? <a href={`mailto:${email}`}>{email}</a> : dash)
  const phone = (value) => (value ? <a href={`tel:${value.replace(/\s+/g, '')}`}>{value}</a> : dash)

  switch (table) {
    case 'leads':
      return {
        title: fullName(record),
        subtitle: record.company_name || 'No company listed',
        badges: <StatusBadge kind="lead" value={record.status} />,
        rows: [
          ['Email', mail(record.email)],
          ['Phone', phone(record.phone)],
          ['Company', record.company_name || dash],
          ['Assigned to', <UserChip key="u" user={get('users', record.assigned_user_id)} />],
          ['Created', formatDate(record.created_at)],
        ],
      }

    case 'contacts':
      return {
        title: fullName(record),
        subtitle: record.job_title || 'No job title listed',
        badges: null,
        rows: [
          ['Account', accountLink],
          ['Email', mail(record.email)],
          ['Phone', phone(record.phone)],
          ['Owner', <UserChip key="u" user={get('users', record.owner_user_id)} empty="No owner" />],
          ['Created', formatDate(record.created_at)],
        ],
      }

    case 'opportunities': {
      const contact = get('contacts', record.primary_contact_id)
      return {
        title: record.title,
        subtitle: account ? account.account_name : '',
        badges: <StatusBadge kind="stage" value={record.stage} />,
        rows: [
          ['Amount', <strong key="a">{formatMoney(record.amount)}</strong>],
          ['Account', accountLink],
          ['Primary contact', contact ? fullName(contact) : dash],
          ['Expected close', record.close_date ? formatDate(record.close_date) : dash],
          ['Owner', <UserChip key="u" user={get('users', record.owner_user_id)} empty="No owner" />],
          ['Created', formatDate(record.created_at)],
        ],
      }
    }

    case 'tickets': {
      const contact = get('contacts', record.contact_id)
      return {
        title: record.subject,
        subtitle: `Ticket #${record.ticket_id}`,
        badges: (
          <>
            <StatusBadge kind="priority" value={record.priority} />
            <StatusBadge kind="ticket" value={record.status} />
          </>
        ),
        rows: [
          ['Contact', contact ? fullName(contact) : dash],
          ['Account', accountLink],
          ['Assigned to', <UserChip key="u" user={get('users', record.assigned_user_id)} />],
          ['Created', formatDate(record.created_at)],
        ],
      }
    }

    default:
      return { title: '', subtitle: '', badges: null, rows: [] }
  }
}

export default function RecordDrawer({ table, id, onClose }) {
  const { data, get, currentUser, convertLead } = useCrm()
  const { openForm, askDelete } = useDialogs()
  const toast = useToast()

  const record = get(table, id)
  if (!record) return null

  const { title, subtitle, badges, rows } = describe(table, record, get, onClose)
  const linkField = ACTIVITY_LINK[table]
  const activities = data.activities
    .filter((activity) => activity[linkField] === id)
    .sort((a, b) => new Date(b.due_date ?? b.created_at) - new Date(a.due_date ?? a.created_at))

  function logActivity() {
    openForm('activities', {
      defaults: { [linkField]: id, performed_by_user_id: currentUser?.user_id },
    })
  }

  function handleConvert() {
    convertLead(id)
    toast('Lead converted to an account and a contact')
  }

  const actions = (
    <>
      <button type="button" className="btn btn--secondary" onClick={() => openForm(table, { record })}>
        <LuPencil aria-hidden="true" /> Edit
      </button>
      <button type="button" className="btn btn--secondary" onClick={logActivity}>
        <LuPlus aria-hidden="true" /> Log activity
      </button>
      {table === 'leads' && record.status !== 'Converted' ? (
        <button type="button" className="btn btn--secondary" onClick={handleConvert}>
          <LuUserCheck aria-hidden="true" /> Convert
        </button>
      ) : null}
      <button type="button" className="btn btn--danger-ghost push-right" onClick={() => askDelete(table, id)}>
        <LuTrash2 aria-hidden="true" /> Delete
      </button>
    </>
  )

  return (
    <Drawer title={title} subtitle={subtitle} onClose={onClose} actions={actions}>
      {badges ? <div className="badge-row">{badges}</div> : null}

      <dl className="detail-list">
        {rows.map(([label, value]) => (
          <Row key={label} label={label}>
            {value}
          </Row>
        ))}
      </dl>

      <section className="drawer__section">
        <h3>Activity</h3>
        {activities.length === 0 ? (
          <p className="muted">No activity logged yet. Use “Log activity” to record a call, meeting, email, task or note.</p>
        ) : (
          <ul className="timeline">
            {activities.map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.type]
              const performer = get('users', activity.performed_by_user_id)
              const overdue = isOverdue(activity)
              return (
                <li key={activity.activity_id}>
                  <button type="button" className="timeline__item" onClick={() => openForm('activities', { record: activity })}>
                    <span className={`type-icon type-icon--${activity.type.toLowerCase()}`}>
                      <Icon aria-hidden="true" />
                    </span>
                    <span className="timeline__text">
                      <span className="timeline__subject">{activity.subject}</span>
                      <span className={`timeline__meta${overdue ? ' is-overdue' : ''}`}>
                        {activity.due_date ? formatDateTime(activity.due_date) : 'No due date'}
                        {performer ? `, ${performer.full_name}` : ''}
                      </span>
                    </span>
                    <StatusBadge kind="activity" value={activity.status} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </Drawer>
  )
}
