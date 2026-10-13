import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LuBuilding2,
  LuCalendarCheck,
  LuChevronDown,
  LuContact,
  LuLayoutDashboard,
  LuLifeBuoy,
  LuMenu,
  LuPlus,
  LuTarget,
  LuUserPlus,
  LuUsers,
} from 'react-icons/lu'
import Avatar from './Avatar.jsx'
import { useCrm } from '../context/CrmContext.jsx'
import { useDialogs } from '../context/dialogContext.js'
import { OPEN_TICKET_STATUSES } from '../config/schema.js'
import { isOverdue } from '../utils/format.js'

const NAV = [
  {
    group: 'Sell',
    items: [
      { to: '/', label: 'Dashboard', icon: LuLayoutDashboard, end: true },
      { to: '/leads', label: 'Leads', icon: LuUserPlus, badge: 'newLeads' },
      { to: '/opportunities', label: 'Opportunities', icon: LuTarget },
    ],
  },
  {
    group: 'Customers',
    items: [
      { to: '/accounts', label: 'Accounts', icon: LuBuilding2 },
      { to: '/contacts', label: 'Contacts', icon: LuContact },
    ],
  },
  {
    group: 'Service',
    items: [{ to: '/tickets', label: 'Tickets', icon: LuLifeBuoy, badge: 'openTickets' }],
  },
  {
    group: 'Work',
    items: [
      { to: '/activities', label: 'Activities', icon: LuCalendarCheck, badge: 'overdue' },
      { to: '/team', label: 'Team', icon: LuUsers },
    ],
  },
]

const QUICK_ADD = [
  { table: 'leads', label: 'Lead' },
  { table: 'accounts', label: 'Account' },
  { table: 'contacts', label: 'Contact' },
  { table: 'opportunities', label: 'Opportunity' },
  { table: 'tickets', label: 'Ticket' },
  { table: 'activities', label: 'Activity' },
]

function BrandMark() {
  return (
    <svg className="brand__mark" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="12.5" cy="16" r="6" fill="none" stroke="#E7A13A" strokeWidth="2.6" />
      <circle cx="19.5" cy="16" r="6" fill="none" stroke="#FFFFFF" strokeWidth="2.6" />
    </svg>
  )
}

function QuickAdd() {
  const { openForm } = useDialogs()
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (box.current && !box.current.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="menu" ref={box}>
      <button
        type="button"
        className="btn btn--primary"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <LuPlus aria-hidden="true" /> New <LuChevronDown aria-hidden="true" />
      </button>
      {open ? (
        <ul className="menu__list" role="menu">
          {QUICK_ADD.map((item) => (
            <li key={item.table} role="none">
              <button
                type="button"
                role="menuitem"
                className="menu__item"
                onClick={() => {
                  setOpen(false)
                  openForm(item.table)
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export default function Layout() {
  const { data, currentUser } = useCrm()
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  // Close the mobile menu whenever the page changes
  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  const badges = useMemo(
    () => ({
      newLeads: data.leads.filter((lead) => lead.status === 'New').length,
      openTickets: data.tickets.filter((ticket) => OPEN_TICKET_STATUSES.includes(ticket.status)).length,
      overdue: data.activities.filter(isOverdue).length,
    }),
    [data],
  )

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="app">
      <aside className={`sidebar${navOpen ? ' is-open' : ''}`} aria-label="Main navigation">
        <div className="brand">
          <BrandMark />
          <span className="brand__name">Mini CRM</span>
        </div>

        <nav className="nav">
          {NAV.map((section) => (
            <div key={section.group} className="nav__group">
              <p className="nav__label">{section.group}</p>
              {section.items.map((item) => {
                const Icon = item.icon
                const count = item.badge ? badges[item.badge] : 0
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `nav__link${isActive ? ' is-active' : ''}`}
                  >
                    <Icon aria-hidden="true" />
                    <span>{item.label}</span>
                    {count > 0 ? (
                      <span className={`nav__count${item.badge === 'overdue' ? ' is-alert' : ''}`}>{count}</span>
                    ) : null}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar__foot">Front-end preview with sample data</div>
      </aside>

      {navOpen ? <button type="button" className="scrim" aria-label="Close menu" onClick={() => setNavOpen(false)} /> : null}

      <div className="main">
        <header className="topbar">
          <div className="topbar__left">
            <button
              type="button"
              className="icon-btn topbar__menu"
              aria-label="Open menu"
              onClick={() => setNavOpen(true)}
            >
              <LuMenu aria-hidden="true" />
            </button>
            <span className="topbar__date">{today}</span>
          </div>
          <div className="topbar__right">
            <QuickAdd />
            {currentUser ? (
              <div className="account-chip">
                <Avatar name={currentUser.full_name} size={32} />
                <div className="account-chip__text">
                  <span>{currentUser.full_name}</span>
                  <small>{currentUser.role}</small>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
