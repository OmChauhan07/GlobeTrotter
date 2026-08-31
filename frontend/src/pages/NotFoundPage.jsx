import { Link } from 'react-router-dom'

import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export default function NotFoundPage() {
  return (
    <div className="auth-page">
      <Card title="Page not found">
        <p>The route you requested does not exist.</p>
        <Link to="/dashboard">
          <Button>Back to dashboard</Button>
        </Link>
      </Card>
    </div>
  )
}
