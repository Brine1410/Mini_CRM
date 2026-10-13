/**
 * A JavaScript mirror of database/mini_crm.sql.
 *
 * - ENUMS      -> every enum(...) column, in the same order as the SQL.
 * - SCHEMA     -> primary keys and foreign keys (with their ON DELETE rule).
 *
 * The UI uses this to build dropdowns and to imitate what MySQL would do when
 * a record is deleted (cascade / set null). When the real backend arrives,
 * MySQL does this work and the reducer logic can be removed.
 */

export const ENUMS = {
  userRole: ['Sales Rep', 'Account Manager', 'Support Agent', 'Admin'],
  leadStatus: ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted'],
  oppStage: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
  ticketPriority: ['Low', 'Medium', 'High', 'Urgent'],
  ticketStatus: ['Open', 'In Progress', 'Waiting on Customer', 'Resolved', 'Closed'],
  activityType: ['Call', 'Meeting', 'Email', 'Task', 'Note'],
  activityStatus: ['Pending', 'Completed', 'Cancelled'],
}

export const OPEN_STAGES = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation']
export const OPEN_TICKET_STATUSES = ['Open', 'In Progress', 'Waiting on Customer']

export const SCHEMA = {
  users: {
    pk: 'user_id',
    singular: 'team member',
    plural: 'team members',
    fks: [],
  },
  leads: {
    pk: 'lead_id',
    singular: 'lead',
    plural: 'leads',
    fks: [{ field: 'assigned_user_id', ref: 'users', onDelete: 'set null' }],
  },
  accounts: {
    pk: 'account_id',
    singular: 'account',
    plural: 'accounts',
    fks: [{ field: 'owner_user_id', ref: 'users', onDelete: 'set null' }],
  },
  contacts: {
    pk: 'contact_id',
    singular: 'contact',
    plural: 'contacts',
    fks: [
      { field: 'account_id', ref: 'accounts', onDelete: 'set null' },
      { field: 'owner_user_id', ref: 'users', onDelete: 'set null' },
    ],
  },
  opportunities: {
    pk: 'opportunity_id',
    singular: 'opportunity',
    plural: 'opportunities',
    fks: [
      { field: 'account_id', ref: 'accounts', onDelete: 'cascade' },
      { field: 'primary_contact_id', ref: 'contacts', onDelete: 'set null' },
      { field: 'owner_user_id', ref: 'users', onDelete: 'set null' },
    ],
  },
  tickets: {
    pk: 'ticket_id',
    singular: 'ticket',
    plural: 'tickets',
    fks: [
      { field: 'account_id', ref: 'accounts', onDelete: 'set null' },
      { field: 'contact_id', ref: 'contacts', onDelete: 'cascade' },
      { field: 'assigned_user_id', ref: 'users', onDelete: 'set null' },
    ],
  },
  activities: {
    pk: 'activity_id',
    singular: 'activity',
    plural: 'activities',
    fks: [
      { field: 'performed_by_user_id', ref: 'users', onDelete: 'cascade' },
      { field: 'lead_id', ref: 'leads', onDelete: 'cascade' },
      { field: 'contact_id', ref: 'contacts', onDelete: 'cascade' },
      { field: 'opportunity_id', ref: 'opportunities', onDelete: 'cascade' },
      { field: 'ticket_id', ref: 'tickets', onDelete: 'cascade' },
    ],
  },
}

export const capitalize = (text = '') => text.charAt(0).toUpperCase() + text.slice(1)
