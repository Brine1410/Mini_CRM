import { LuMail, LuPhone, LuStickyNote, LuListChecks, LuVideo } from 'react-icons/lu'

// Colour tone of the badge for every enum value in the database.
export const TONES = {
  lead: { New: 'blue', Contacted: 'amber', Qualified: 'teal', Unqualified: 'neutral', Converted: 'green' },
  stage: {
    Prospecting: 'neutral',
    Qualification: 'blue',
    Proposal: 'violet',
    Negotiation: 'amber',
    'Closed Won': 'green',
    'Closed Lost': 'red',
  },
  priority: { Low: 'neutral', Medium: 'blue', High: 'amber', Urgent: 'red' },
  ticket: {
    Open: 'blue',
    'In Progress': 'violet',
    'Waiting on Customer': 'amber',
    Resolved: 'green',
    Closed: 'neutral',
  },
  activity: { Pending: 'amber', Completed: 'green', Cancelled: 'neutral' },
  role: { Admin: 'violet', 'Account Manager': 'teal', 'Sales Rep': 'blue', 'Support Agent': 'amber' },
}

// Pipeline stage colours (used for the board columns and the dashboard bar).
export const STAGE_COLORS = {
  Prospecting: '#8296A3',
  Qualification: '#3F86C5',
  Proposal: '#7462D6',
  Negotiation: '#E7A13A',
  'Closed Won': '#2E8B57',
  'Closed Lost': '#C8443A',
}

export const LEAD_COLORS = {
  New: '#3F86C5',
  Contacted: '#E7A13A',
  Qualified: '#1D8A7E',
  Unqualified: '#8296A3',
  Converted: '#2E8B57',
}

export const PRIORITY_COLORS = {
  Urgent: '#C8443A',
  High: '#E7A13A',
  Medium: '#3F86C5',
  Low: '#8296A3',
}

export const PRIORITY_RANK = { Urgent: 4, High: 3, Medium: 2, Low: 1 }

export const ACTIVITY_ICONS = {
  Call: LuPhone,
  Meeting: LuVideo,
  Email: LuMail,
  Task: LuListChecks,
  Note: LuStickyNote,
}
