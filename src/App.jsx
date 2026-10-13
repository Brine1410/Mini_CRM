import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Leads from './pages/Leads.jsx'
import Accounts from './pages/Accounts.jsx'
import AccountDetail from './pages/AccountDetail.jsx'
import Contacts from './pages/Contacts.jsx'
import Opportunities from './pages/Opportunities.jsx'
import Tickets from './pages/Tickets.jsx'
import Activities from './pages/Activities.jsx'
import Team from './pages/Team.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="opportunities" element={<Opportunities />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="accounts/:id" element={<AccountDetail />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="activities" element={<Activities />} />
        <Route path="team" element={<Team />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
