import { daysFromNow as d, dateFromNow as day } from '../utils/format.js'

/**
 * Sample records for every table in database/mini_crm.sql.
 * Column names are identical to the SQL columns, so once the backend exists
 * the API responses can replace this file without touching the components.
 *
 * Dates are generated relative to "today" so the dashboard always looks fresh.
 */

// The person "signed in" to the demo. Change the id to view the app as someone else.
export const CURRENT_USER_ID = 1

export function createInitialData() {
  const users = [
    { user_id: 1, full_name: 'Maya Chen', email: 'maya.chen@minicrm.io', role: 'Admin', created_at: d(-180, 9) },
    { user_id: 2, full_name: 'Daniel Okafor', email: 'daniel.okafor@minicrm.io', role: 'Sales Rep', created_at: d(-150, 9) },
    { user_id: 3, full_name: 'Sofia Rossi', email: 'sofia.rossi@minicrm.io', role: 'Account Manager', created_at: d(-140, 10) },
    { user_id: 4, full_name: 'Liam Patel', email: 'liam.patel@minicrm.io', role: 'Sales Rep', created_at: d(-120, 11) },
    { user_id: 5, full_name: 'Hannah Müller', email: 'hannah.mueller@minicrm.io', role: 'Support Agent', created_at: d(-100, 9) },
    { user_id: 6, full_name: 'Carlos Mendes', email: 'carlos.mendes@minicrm.io', role: 'Support Agent', created_at: d(-90, 14) },
  ]

  const leads = [
    { lead_id: 1, first_name: 'Elena', last_name: 'Petrova', company_name: 'Northwind Logistics', email: 'elena.petrova@northwindlog.com', phone: '+1 415 555 0142', status: 'Converted', assigned_user_id: 3, created_at: d(-95, 10) },
    { lead_id: 2, first_name: 'Marcus', last_name: 'Bell', company_name: 'BrightPath Learning', email: 'marcus.bell@brightpath.com', phone: '+1 212 555 0177', status: 'New', assigned_user_id: 4, created_at: d(-2, 9) },
    { lead_id: 3, first_name: 'Aisha', last_name: 'Rahman', company_name: 'Kestrel Health', email: 'aisha.rahman@kestrelhealth.com', phone: '+1 312 555 0119', status: 'Contacted', assigned_user_id: 2, created_at: d(-9, 15) },
    { lead_id: 4, first_name: 'Tom', last_name: 'Jensen', company_name: 'Fjord Foods', email: 'tom.jensen@fjordfoods.com', phone: '+47 22 55 01 88', status: 'New', assigned_user_id: 4, created_at: d(-1, 13) },
    { lead_id: 5, first_name: 'Priya', last_name: 'Nair', company_name: 'Lumen Retail', email: 'priya.nair@lumenretail.com', phone: '+1 646 555 0163', status: 'Converted', assigned_user_id: 3, created_at: d(-70, 10) },
    { lead_id: 6, first_name: 'Stefan', last_name: 'Keller', company_name: 'Alpine Robotics', email: 'stefan.keller@alpinerobotics.com', phone: '+41 44 555 01 28', status: 'Qualified', assigned_user_id: 2, created_at: d(-21, 11) },
    { lead_id: 7, first_name: 'Grace', last_name: 'Liu', company_name: 'Harborview Systems', email: 'grace.liu@harborview.io', phone: '+1 206 555 0134', status: 'Contacted', assigned_user_id: 4, created_at: d(-6, 16) },
    { lead_id: 8, first_name: 'Omar', last_name: 'Haddad', company_name: 'Sahara Solar', email: 'omar.haddad@saharasolar.com', phone: null, status: 'Unqualified', assigned_user_id: 2, created_at: d(-33, 12) },
    { lead_id: 9, first_name: 'Diego', last_name: 'Alvarez', company_name: null, email: 'diego.alvarez@example.com', phone: '+34 91 555 01 17', status: 'New', assigned_user_id: null, created_at: d(0, 8) },
    { lead_id: 10, first_name: 'Nora', last_name: 'Whitfield', company_name: 'Ironbridge Insurance', email: 'nora.whitfield@ironbridge.com', phone: '+44 20 5550 0166', status: 'Contacted', assigned_user_id: 4, created_at: d(-12, 9) },
    { lead_id: 11, first_name: 'Hiro', last_name: 'Sato', company_name: 'Sakura Analytics', email: 'hiro.sato@sakura-analytics.jp', phone: '+81 3 5550 0158', status: 'Qualified', assigned_user_id: 3, created_at: d(-16, 10) },
    { lead_id: 12, first_name: 'Rafael', last_name: 'Costa', company_name: 'Costa & Filhos Imports', email: 'rafael@costaimports.com', phone: '+351 21 555 0102', status: 'Unqualified', assigned_user_id: 2, created_at: d(-44, 14) },
  ]

  const accounts = [
    { account_id: 1, account_name: 'Northwind Logistics', industry: 'Logistics', website: 'https://northwindlog.com', annual_revenue: 48000000, owner_user_id: 3, created_at: d(-90, 10) },
    { account_id: 2, account_name: 'Lumen Retail', industry: 'Retail', website: 'https://lumenretail.com', annual_revenue: 120000000, owner_user_id: 3, created_at: d(-68, 11) },
    { account_id: 3, account_name: 'Kestrel Health', industry: 'Healthcare', website: 'https://kestrelhealth.com', annual_revenue: 76500000, owner_user_id: 2, created_at: d(-55, 9) },
    { account_id: 4, account_name: 'Alpine Robotics', industry: 'Manufacturing', website: 'https://alpinerobotics.com', annual_revenue: 32000000, owner_user_id: 2, created_at: d(-40, 13) },
    { account_id: 5, account_name: 'Fjord Foods', industry: 'Food & Beverage', website: 'https://fjordfoods.com', annual_revenue: 58250000, owner_user_id: 4, created_at: d(-38, 10) },
    { account_id: 6, account_name: 'Sakura Analytics', industry: 'Technology', website: 'https://sakura-analytics.jp', annual_revenue: 18900000, owner_user_id: 3, created_at: d(-25, 15) },
    { account_id: 7, account_name: 'Ironbridge Insurance', industry: 'Financial Services', website: 'https://ironbridge.com', annual_revenue: 210000000, owner_user_id: 4, created_at: d(-20, 9) },
    { account_id: 8, account_name: 'Verde Studio', industry: 'Media', website: null, annual_revenue: 4200000, owner_user_id: 1, created_at: d(-4, 11) },
  ]

  const contacts = [
    { contact_id: 1, account_id: 1, first_name: 'Elena', last_name: 'Petrova', email: 'elena.petrova@northwindlog.com', phone: '+1 415 555 0142', job_title: 'VP Operations', owner_user_id: 3, created_at: d(-88, 10) },
    { contact_id: 2, account_id: 1, first_name: 'Jonas', last_name: 'Weber', email: 'jonas.weber@northwindlog.com', phone: '+1 415 555 0150', job_title: 'Procurement Manager', owner_user_id: 3, created_at: d(-85, 14) },
    { contact_id: 3, account_id: 2, first_name: 'Priya', last_name: 'Nair', email: 'priya.nair@lumenretail.com', phone: '+1 646 555 0163', job_title: 'Head of Digital', owner_user_id: 3, created_at: d(-66, 10) },
    { contact_id: 4, account_id: 2, first_name: 'Leo', last_name: 'Fernandez', email: 'leo.fernandez@lumenretail.com', phone: '+1 646 555 0171', job_title: 'CFO', owner_user_id: 3, created_at: d(-64, 12) },
    { contact_id: 5, account_id: 3, first_name: 'Amara', last_name: 'Okoye', email: 'amara.okoye@kestrelhealth.com', phone: '+1 312 555 0128', job_title: 'Chief Medical Officer', owner_user_id: 2, created_at: d(-54, 9) },
    { contact_id: 6, account_id: 3, first_name: 'Peter', last_name: 'Lang', email: 'peter.lang@kestrelhealth.com', phone: '+1 312 555 0133', job_title: 'IT Director', owner_user_id: 2, created_at: d(-52, 11) },
    { contact_id: 7, account_id: 4, first_name: 'Noah', last_name: 'Fischer', email: 'noah.fischer@alpinerobotics.com', phone: '+41 44 555 01 20', job_title: 'CTO', owner_user_id: 2, created_at: d(-39, 10) },
    { contact_id: 8, account_id: 5, first_name: 'Ingrid', last_name: 'Solberg', email: 'ingrid.solberg@fjordfoods.com', phone: '+47 22 55 01 91', job_title: 'Operations Director', owner_user_id: 4, created_at: d(-37, 9) },
    { contact_id: 9, account_id: 5, first_name: 'Henrik', last_name: 'Dahl', email: 'henrik.dahl@fjordfoods.com', phone: null, job_title: 'Buyer', owner_user_id: 4, created_at: d(-36, 15) },
    { contact_id: 10, account_id: 6, first_name: 'Yuki', last_name: 'Tanaka', email: 'yuki.tanaka@sakura-analytics.jp', phone: '+81 3 5550 0146', job_title: 'Data Lead', owner_user_id: 3, created_at: d(-24, 10) },
    { contact_id: 11, account_id: 7, first_name: 'Victoria', last_name: 'Hale', email: 'victoria.hale@ironbridge.com', phone: '+44 20 5550 0192', job_title: 'Chief Risk Officer', owner_user_id: 4, created_at: d(-19, 9) },
    { contact_id: 12, account_id: 7, first_name: 'Ben', last_name: 'Carter', email: 'ben.carter@ironbridge.com', phone: '+44 20 5550 0181', job_title: 'Head of Claims Technology', owner_user_id: 4, created_at: d(-18, 13) },
    { contact_id: 13, account_id: 8, first_name: 'Chloe', last_name: 'Martin', email: 'chloe.martin@verdestudio.com', phone: '+33 1 55 01 22 90', job_title: 'Creative Director', owner_user_id: 1, created_at: d(-3, 10) },
    { contact_id: 14, account_id: null, first_name: 'Ravi', last_name: 'Shankar', email: 'ravi@shankarconsulting.com', phone: '+91 22 5550 0144', job_title: 'Independent consultant', owner_user_id: 2, created_at: d(-8, 16) },
  ]

  const opportunities = [
    { opportunity_id: 1, account_id: 1, primary_contact_id: 1, title: 'Fleet tracking platform rollout', amount: 185000, stage: 'Negotiation', close_date: day(21), owner_user_id: 3, created_at: d(-60, 10) },
    { opportunity_id: 2, account_id: 1, primary_contact_id: 2, title: 'Warehouse analytics add-on', amount: 42000, stage: 'Proposal', close_date: day(35), owner_user_id: 3, created_at: d(-30, 11) },
    { opportunity_id: 3, account_id: 2, primary_contact_id: 3, title: 'Omnichannel storefront integration', amount: 240000, stage: 'Proposal', close_date: day(28), owner_user_id: 3, created_at: d(-34, 9) },
    { opportunity_id: 4, account_id: 2, primary_contact_id: 4, title: 'Annual premium support plan', amount: 36000, stage: 'Closed Won', close_date: day(-12), owner_user_id: 3, created_at: d(-50, 14) },
    { opportunity_id: 5, account_id: 3, primary_contact_id: 5, title: 'Patient portal modernization', amount: 310000, stage: 'Qualification', close_date: day(60), owner_user_id: 2, created_at: d(-22, 10) },
    { opportunity_id: 6, account_id: 3, primary_contact_id: 6, title: 'Security audit and compliance', amount: 68000, stage: 'Prospecting', close_date: day(75), owner_user_id: 2, created_at: d(-10, 15) },
    { opportunity_id: 7, account_id: 4, primary_contact_id: 7, title: 'Robotics fleet dashboard', amount: 128000, stage: 'Negotiation', close_date: day(14), owner_user_id: 2, created_at: d(-27, 9) },
    { opportunity_id: 8, account_id: 5, primary_contact_id: 8, title: 'Supply chain visibility suite', amount: 96000, stage: 'Closed Won', close_date: day(-30), owner_user_id: 4, created_at: d(-58, 12) },
    { opportunity_id: 9, account_id: 5, primary_contact_id: 9, title: 'Cold-storage monitoring pilot', amount: 27500, stage: 'Closed Lost', close_date: day(-8), owner_user_id: 4, created_at: d(-41, 10) },
    { opportunity_id: 10, account_id: 6, primary_contact_id: 10, title: 'Analytics workspace licenses', amount: 54000, stage: 'Qualification', close_date: day(40), owner_user_id: 3, created_at: d(-15, 11) },
    { opportunity_id: 11, account_id: 7, primary_contact_id: 11, title: 'Claims automation program', amount: 420000, stage: 'Proposal', close_date: day(50), owner_user_id: 4, created_at: d(-17, 9) },
    { opportunity_id: 12, account_id: 7, primary_contact_id: 12, title: 'Fraud signals integration', amount: 150000, stage: 'Prospecting', close_date: day(90), owner_user_id: 4, created_at: d(-5, 14) },
  ]

  const tickets = [
    { ticket_id: 1, account_id: 2, contact_id: 3, assigned_user_id: 5, subject: 'Checkout page returns error 500 when a coupon is applied', priority: 'High', status: 'Open', created_at: d(-1, 9) },
    { ticket_id: 2, account_id: 2, contact_id: 4, assigned_user_id: 6, subject: 'Invoice PDF is missing the tax breakdown', priority: 'Medium', status: 'In Progress', created_at: d(-3, 11) },
    { ticket_id: 3, account_id: 1, contact_id: 2, assigned_user_id: 5, subject: 'Add 25 new user seats to the workspace', priority: 'Low', status: 'Waiting on Customer', created_at: d(-6, 10) },
    { ticket_id: 4, account_id: 1, contact_id: 1, assigned_user_id: 6, subject: 'GPS sync delay on older tracker models', priority: 'Urgent', status: 'In Progress', created_at: d(-2, 14) },
    { ticket_id: 5, account_id: 3, contact_id: 6, assigned_user_id: 5, subject: 'SSO login loop for newly onboarded staff', priority: 'High', status: 'Open', created_at: d(-4, 9) },
    { ticket_id: 6, account_id: 4, contact_id: 7, assigned_user_id: 6, subject: 'Dashboard CSV export truncates long reports', priority: 'Medium', status: 'Resolved', created_at: d(-9, 13) },
    { ticket_id: 7, account_id: 5, contact_id: 8, assigned_user_id: 5, subject: 'Change the billing contact on the account', priority: 'Low', status: 'Closed', created_at: d(-20, 10) },
    { ticket_id: 8, account_id: 6, contact_id: 10, assigned_user_id: null, subject: 'Workspace invitation emails are not arriving', priority: 'Medium', status: 'Open', created_at: d(-1, 16) },
    { ticket_id: 9, account_id: 7, contact_id: 11, assigned_user_id: 6, subject: 'Question about audit log retention period', priority: 'Low', status: 'Waiting on Customer', created_at: d(-5, 12) },
    { ticket_id: 10, account_id: null, contact_id: 14, assigned_user_id: 5, subject: 'Request to extend the trial period by two weeks', priority: 'Medium', status: 'Open', created_at: d(-2, 9) },
  ]

  const activities = [
    { activity_id: 1, type: 'Call', subject: 'Intro call with Elena Petrova', description: 'Covered current fleet setup and reporting pain points.', due_date: d(-10, 11), status: 'Completed', performed_by_user_id: 2, lead_id: 1, contact_id: null, opportunity_id: null, ticket_id: null, created_at: d(-12, 9) },
    { activity_id: 2, type: 'Email', subject: 'Send product deck to Marcus Bell', description: 'Include the education case studies.', due_date: d(1, 10), status: 'Pending', performed_by_user_id: 4, lead_id: 2, contact_id: null, opportunity_id: null, ticket_id: null, created_at: d(-1, 15) },
    { activity_id: 3, type: 'Meeting', subject: 'Discovery workshop with Kestrel Health', description: 'On-site session with clinical and IT leads.', due_date: d(-5, 14), status: 'Completed', performed_by_user_id: 2, lead_id: null, contact_id: 5, opportunity_id: 5, ticket_id: null, created_at: d(-9, 10) },
    { activity_id: 4, type: 'Task', subject: 'Prepare proposal for the Lumen storefront project', description: null, due_date: d(2, 17), status: 'Pending', performed_by_user_id: 3, lead_id: null, contact_id: null, opportunity_id: 3, ticket_id: null, created_at: d(-3, 11) },
    { activity_id: 5, type: 'Call', subject: 'Pricing negotiation for fleet tracking', description: 'Elena wants a three-year discount option.', due_date: d(1, 15), status: 'Pending', performed_by_user_id: 3, lead_id: null, contact_id: 1, opportunity_id: 1, ticket_id: null, created_at: d(-2, 9) },
    { activity_id: 6, type: 'Note', subject: 'Budget approved for Q4', description: 'Elena confirmed the budget was approved by finance.', due_date: null, status: 'Completed', performed_by_user_id: 3, lead_id: null, contact_id: 1, opportunity_id: 1, ticket_id: null, created_at: d(-3, 16) },
    { activity_id: 7, type: 'Task', subject: 'Follow up on the security questionnaire', description: 'Kestrel is waiting on our completed compliance answers.', due_date: d(-2, 12), status: 'Pending', performed_by_user_id: 2, lead_id: null, contact_id: null, opportunity_id: 6, ticket_id: null, created_at: d(-7, 10) },
    { activity_id: 8, type: 'Meeting', subject: 'Quarterly business review with Lumen Retail', description: null, due_date: d(6, 11), status: 'Pending', performed_by_user_id: 3, lead_id: null, contact_id: 4, opportunity_id: null, ticket_id: null, created_at: d(-4, 13) },
    { activity_id: 9, type: 'Email', subject: 'Confirm SSO fix rollout with Peter Lang', description: null, due_date: d(1, 9), status: 'Pending', performed_by_user_id: 5, lead_id: null, contact_id: 6, opportunity_id: null, ticket_id: 5, created_at: d(-1, 10) },
    { activity_id: 10, type: 'Call', subject: 'Callback about the coupon error', description: 'Customer confirmed it only happens with percentage coupons.', due_date: d(-1, 15), status: 'Completed', performed_by_user_id: 5, lead_id: null, contact_id: 3, opportunity_id: null, ticket_id: 1, created_at: d(-1, 12) },
    { activity_id: 11, type: 'Note', subject: 'Likely cause: coupon service timeout', description: 'Timeouts start when more than 3 coupons are stacked.', due_date: null, status: 'Completed', performed_by_user_id: 5, lead_id: null, contact_id: null, opportunity_id: null, ticket_id: 1, created_at: d(-1, 17) },
    { activity_id: 12, type: 'Task', subject: 'Escalate GPS sync issue to engineering', description: 'Attach the device logs from the customer.', due_date: d(-1, 10), status: 'Pending', performed_by_user_id: 6, lead_id: null, contact_id: null, opportunity_id: null, ticket_id: 4, created_at: d(-2, 15) },
    { activity_id: 13, type: 'Meeting', subject: 'Demo of the robotics fleet dashboard', description: 'Noah has asked for the live telemetry view.', due_date: d(3, 14), status: 'Pending', performed_by_user_id: 2, lead_id: null, contact_id: 7, opportunity_id: 7, ticket_id: null, created_at: d(-5, 9) },
    { activity_id: 14, type: 'Email', subject: 'Send revised quote to Ironbridge', description: null, due_date: d(4, 12), status: 'Pending', performed_by_user_id: 4, lead_id: null, contact_id: null, opportunity_id: 11, ticket_id: null, created_at: d(-2, 14) },
    { activity_id: 15, type: 'Call', subject: 'Qualify interest from Sakura Analytics', description: 'Team of 40 analysts, wants a pilot next quarter.', due_date: d(-7, 10), status: 'Completed', performed_by_user_id: 3, lead_id: 11, contact_id: null, opportunity_id: null, ticket_id: null, created_at: d(-9, 11) },
    { activity_id: 16, type: 'Task', subject: 'Update CRM notes after the Fjord pilot review', description: 'No longer needed, the pilot was closed.', due_date: d(-6, 16), status: 'Cancelled', performed_by_user_id: 4, lead_id: null, contact_id: null, opportunity_id: 9, ticket_id: null, created_at: d(-10, 10) },
    { activity_id: 17, type: 'Meeting', subject: 'Kick-off call with Verde Studio', description: null, due_date: d(5, 10), status: 'Pending', performed_by_user_id: 1, lead_id: null, contact_id: 13, opportunity_id: null, ticket_id: null, created_at: d(-3, 12) },
    { activity_id: 18, type: 'Email', subject: 'Welcome message to Priya Nair', description: 'Sent after the lead was converted.', due_date: d(-15, 9), status: 'Completed', performed_by_user_id: 3, lead_id: 5, contact_id: 3, opportunity_id: null, ticket_id: null, created_at: d(-16, 10) },
  ]

  return { users, leads, accounts, contacts, opportunities, tickets, activities }
}
