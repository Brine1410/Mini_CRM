# Mini Enterprise CRM — Frontend

React + Vite frontend for the Mini Enterprise CRM class project. This phase covers
**database design** and **frontend/UI development only** — there is no backend or
real database connection yet. The app runs entirely in the browser using realistic
sample data that mirrors the schema, kept in memory with React state.

When the backend phase starts, the data layer in `src/context/CrmContext.jsx` is the
only place that needs to change (swap the in-memory reducer for real API calls) —
every page and component already reads and writes through that one context.

## What's included

- **`database/mini_crm.sql`** — the schema exactly as provided (7 tables: `users`,
  `leads`, `accounts`, `contacts`, `opportunities`, `tickets`, `activities`).
- A full React UI covering every table:
  - **Dashboard** — pipeline value by stage, open tickets by priority, leads by
    status, upcoming/overdue activities, biggest open deals.
  - **Leads** — table with status tabs, search, assignee filter, and one-click
    "convert to account + contact".
  - **Accounts** — list + detail page showing that account's contacts,
    opportunities and tickets in tabs.
  - **Contacts** — table with account/owner filters, linked back to their account.
  - **Opportunities** — a drag-and-drop pipeline board (grouped by stage) with a
    table view alternative.
  - **Tickets** — table with status tabs and priority/assignee filters.
  - **Activities** — calls/meetings/emails/tasks/notes, with a due-date view and
    quick "mark complete".
  - **Team** — the `users` table, with each person's current workload.
- Add / edit forms for every table, generated from `src/config/forms.js` — field
  limits (`maxLength`, required, enum options) mirror the `.sql` column
  definitions.
- Delete confirmation that mimics the database's `ON DELETE CASCADE` /
  `ON DELETE SET NULL` foreign key rules (see `src/config/schema.js`), so deleting
  a record shows exactly what else will be removed or unlinked — the same way
  MySQL would behave once it's connected.

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer (includes npm)

## Getting started

```bash
npm install
npm run dev
```

Then open the URL it prints (usually `http://localhost:5173`). The dev server
supports hot reload, so edits to any file appear immediately.

Other scripts:

```bash
npm run build      # production build, output in dist/
npm run preview    # preview the production build locally
```

## Project structure

```
database/
  mini_crm.sql          the provided schema (unchanged)
src/
  config/
    schema.js            table names, primary/foreign keys, enum values — mirrors the SQL
    forms.js              field definitions for every add/edit form
    tones.js               badge colors and icons for each enum value
  context/
    CrmContext.jsx        in-memory "database": all data lives here (React state)
    dialogContext.js      lets any page open the shared modal/drawer/delete dialog
  data/
    mockData.js            realistic sample rows for all 7 tables
  components/              shared UI: table, modal, drawer, badges, form, etc.
  pages/                   one file per route (Dashboard, Leads, Accounts, ...)
  utils/format.js           date/currency/name formatting helpers
  styles/                    plain CSS, split into base / components / pages
```

## Notes for the backend phase

- `src/context/CrmContext.jsx` exposes `data`, `get()`, `add()`, `update()`,
  `remove()`, `convertLead()` and `impactOf()`. Replacing the reducer with
  `fetch`/`axios` calls to the future API (keeping the same function names) means
  no page component needs to change.
- Column names in the sample data and forms match `database/mini_crm.sql`
  exactly, so mapping API responses onto the UI should be a direct 1:1.
