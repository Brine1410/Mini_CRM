import { ENUMS } from './schema.js'

/**
 * One entry per table. Field limits (maxLength, required, enum values) are copied
 * from database/mini_crm.sql so the forms reject anything MySQL would reject.
 *
 * field props:
 *   name, label, type (text | email | tel | number | date | datetime | textarea | select)
 *   required, maxLength, options [{ value, label }], numeric (select holds an id),
 *   placeholder, full (spans both columns), group (heading above a set of fields),
 *   emptyAs (value stored when a number field is left empty), disabled
 */

const options = (list) => list.map((value) => ({ value, label: value }))
const userOptions = (data) => data.users.map((user) => ({ value: user.user_id, label: user.full_name }))
const accountOptions = (data) => data.accounts.map((account) => ({ value: account.account_id, label: account.account_name }))

function contactOptions(data, accountId) {
  return data.contacts
    .filter((contact) => !accountId || String(contact.account_id) === String(accountId))
    .map((contact) => {
      const account = data.accounts.find((item) => item.account_id === contact.account_id)
      return {
        value: contact.contact_id,
        label: `${contact.first_name} ${contact.last_name}${account ? ` (${account.account_name})` : ''}`,
      }
    })
}

const leadOptions = (data) =>
  data.leads.map((lead) => ({
    value: lead.lead_id,
    label: `${lead.first_name} ${lead.last_name}${lead.company_name ? ` (${lead.company_name})` : ''}`,
  }))

const opportunityOptions = (data) =>
  data.opportunities.map((opp) => ({ value: opp.opportunity_id, label: opp.title }))

const ticketOptions = (data) =>
  data.tickets.map((ticket) => ({ value: ticket.ticket_id, label: `#${ticket.ticket_id} ${ticket.subject}` }))

export const FORMS = {
  // -------------------------------------------------------------- users
  users: {
    fields: () => [
      { name: 'full_name', label: 'Full name', type: 'text', required: true, maxLength: 100, full: true },
      { name: 'email', label: 'Email', type: 'email', required: true, maxLength: 150, full: true },
      { name: 'role', label: 'Role', type: 'select', required: true, options: options(ENUMS.userRole) },
    ],
    defaults: () => ({ role: 'Sales Rep' }),
    // users.email is UNIQUE in the database
    validate: (values, data, record) => {
      const email = String(values.email || '').trim().toLowerCase()
      const clash = data.users.some((user) => user.email.toLowerCase() === email && user.user_id !== record?.user_id)
      return clash ? { email: 'Another team member already uses this email' } : {}
    },
  },

  // -------------------------------------------------------------- leads
  leads: {
    fields: (data) => [
      { name: 'first_name', label: 'First name', type: 'text', required: true, maxLength: 50 },
      { name: 'last_name', label: 'Last name', type: 'text', required: true, maxLength: 50 },
      { name: 'company_name', label: 'Company', type: 'text', maxLength: 100, full: true },
      { name: 'email', label: 'Email', type: 'email', required: true, maxLength: 150 },
      { name: 'phone', label: 'Phone', type: 'tel', maxLength: 20 },
      { name: 'status', label: 'Status', type: 'select', required: true, options: options(ENUMS.leadStatus) },
      {
        name: 'assigned_user_id',
        label: 'Assigned to',
        type: 'select',
        numeric: true,
        options: userOptions(data),
        placeholder: 'Unassigned',
      },
    ],
    defaults: ({ currentUser }) => ({ status: 'New', assigned_user_id: currentUser?.user_id }),
  },

  // ----------------------------------------------------------- accounts
  accounts: {
    fields: (data) => [
      { name: 'account_name', label: 'Account name', type: 'text', required: true, maxLength: 100, full: true },
      { name: 'industry', label: 'Industry', type: 'text', maxLength: 50 },
      { name: 'website', label: 'Website', type: 'text', maxLength: 150, placeholder: 'https://example.com' },
      { name: 'annual_revenue', label: 'Annual revenue', type: 'number', min: 0, max: 9999999999999.99 },
      {
        name: 'owner_user_id',
        label: 'Account owner',
        type: 'select',
        numeric: true,
        options: userOptions(data),
        placeholder: 'No owner',
      },
    ],
    defaults: ({ currentUser }) => ({ owner_user_id: currentUser?.user_id }),
  },

  // ----------------------------------------------------------- contacts
  contacts: {
    fields: (data) => [
      { name: 'first_name', label: 'First name', type: 'text', required: true, maxLength: 50 },
      { name: 'last_name', label: 'Last name', type: 'text', required: true, maxLength: 50 },
      { name: 'email', label: 'Email', type: 'email', required: true, maxLength: 150 },
      { name: 'phone', label: 'Phone', type: 'tel', maxLength: 20 },
      { name: 'job_title', label: 'Job title', type: 'text', maxLength: 100, full: true },
      {
        name: 'account_id',
        label: 'Account',
        type: 'select',
        numeric: true,
        options: accountOptions(data),
        placeholder: 'No account',
      },
      {
        name: 'owner_user_id',
        label: 'Contact owner',
        type: 'select',
        numeric: true,
        options: userOptions(data),
        placeholder: 'No owner',
      },
    ],
    defaults: ({ currentUser }) => ({ owner_user_id: currentUser?.user_id }),
  },

  // ------------------------------------------------------ opportunities
  opportunities: {
    fields: (data, values) => [
      { name: 'title', label: 'Opportunity title', type: 'text', required: true, maxLength: 150, full: true },
      {
        name: 'account_id',
        label: 'Account',
        type: 'select',
        numeric: true,
        required: true,
        options: accountOptions(data),
        placeholder: 'Select an account',
      },
      {
        name: 'primary_contact_id',
        label: 'Primary contact',
        type: 'select',
        numeric: true,
        options: values.account_id ? contactOptions(data, values.account_id) : [],
        placeholder: values.account_id ? 'No primary contact' : 'Select an account first',
        disabled: !values.account_id,
      },
      { name: 'amount', label: 'Amount', type: 'number', min: 0, max: 9999999999999.99, emptyAs: 0 },
      { name: 'stage', label: 'Stage', type: 'select', required: true, options: options(ENUMS.oppStage) },
      { name: 'close_date', label: 'Expected close date', type: 'date' },
      {
        name: 'owner_user_id',
        label: 'Owner',
        type: 'select',
        numeric: true,
        options: userOptions(data),
        placeholder: 'No owner',
      },
    ],
    defaults: ({ currentUser }) => ({ stage: 'Prospecting', amount: 0, owner_user_id: currentUser?.user_id }),
    // A primary contact must belong to the chosen account
    onChange: (values, changed, data) => {
      if (changed === 'account_id' && values.primary_contact_id) {
        const contact = data.contacts.find((item) => String(item.contact_id) === values.primary_contact_id)
        if (!contact || String(contact.account_id) !== values.account_id) {
          return { ...values, primary_contact_id: '' }
        }
      }
      return values
    },
  },

  // ------------------------------------------------------------ tickets
  tickets: {
    fields: (data) => [
      { name: 'subject', label: 'Subject', type: 'text', required: true, maxLength: 200, full: true },
      {
        name: 'contact_id',
        label: 'Contact',
        type: 'select',
        numeric: true,
        required: true,
        options: contactOptions(data),
        placeholder: 'Select a contact',
      },
      {
        name: 'account_id',
        label: 'Account',
        type: 'select',
        numeric: true,
        options: accountOptions(data),
        placeholder: 'No account',
      },
      { name: 'priority', label: 'Priority', type: 'select', required: true, options: options(ENUMS.ticketPriority) },
      { name: 'status', label: 'Status', type: 'select', required: true, options: options(ENUMS.ticketStatus) },
      {
        name: 'assigned_user_id',
        label: 'Assigned to',
        type: 'select',
        numeric: true,
        options: userOptions(data),
        placeholder: 'Unassigned',
        full: true,
      },
    ],
    defaults: () => ({ priority: 'Medium', status: 'Open' }),
    // Picking a contact fills in that contact's account when none is chosen yet
    onChange: (values, changed, data) => {
      if (changed === 'contact_id' && values.contact_id && !values.account_id) {
        const contact = data.contacts.find((item) => String(item.contact_id) === values.contact_id)
        if (contact?.account_id) return { ...values, account_id: String(contact.account_id) }
      }
      return values
    },
  },

  // --------------------------------------------------------- activities
  activities: {
    fields: (data) => [
      { name: 'type', label: 'Type', type: 'select', required: true, options: options(ENUMS.activityType) },
      { name: 'status', label: 'Status', type: 'select', required: true, options: options(ENUMS.activityStatus) },
      { name: 'subject', label: 'Subject', type: 'text', required: true, maxLength: 150, full: true },
      { name: 'description', label: 'Notes', type: 'textarea', full: true },
      { name: 'due_date', label: 'Due', type: 'datetime' },
      {
        name: 'performed_by_user_id',
        label: 'Performed by',
        type: 'select',
        numeric: true,
        required: true,
        options: userOptions(data),
        placeholder: 'Select a team member',
      },
      {
        name: 'lead_id',
        label: 'Lead',
        type: 'select',
        numeric: true,
        options: leadOptions(data),
        placeholder: 'None',
        group: 'Related records',
      },
      {
        name: 'contact_id',
        label: 'Contact',
        type: 'select',
        numeric: true,
        options: contactOptions(data),
        placeholder: 'None',
      },
      {
        name: 'opportunity_id',
        label: 'Opportunity',
        type: 'select',
        numeric: true,
        options: opportunityOptions(data),
        placeholder: 'None',
      },
      {
        name: 'ticket_id',
        label: 'Ticket',
        type: 'select',
        numeric: true,
        options: ticketOptions(data),
        placeholder: 'None',
      },
    ],
    defaults: ({ currentUser }) => ({
      type: 'Task',
      status: 'Pending',
      performed_by_user_id: currentUser?.user_id,
    }),
  },
}
