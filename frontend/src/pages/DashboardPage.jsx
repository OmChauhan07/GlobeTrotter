import { Card } from '../components/ui/Card'

export default function DashboardPage() {
  return (
    <div className="page-grid">
      <Card title="Overview">
        <p>Welcome back to GlobeTrotter.</p>
        <p>Your upcoming adventures will appear here.</p>
      </Card>
      <Card title="Quick stats">
        <ul className="stack-list">
          <li>Trips: 0</li>
          <li>Budget: $0</li>
          <li>Shared plans: 0</li>
        </ul>
      </Card>
    </div>
  )
}
