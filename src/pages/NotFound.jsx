import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'

export default function NotFound() {
  return (
    <div className="panel">
      <EmptyState
        title="This page does not exist"
        description="The link may be old or mistyped. Head back to the dashboard to continue."
        action={
          <Link to="/" className="btn btn--primary">
            Go to dashboard
          </Link>
        }
      />
    </div>
  )
}
