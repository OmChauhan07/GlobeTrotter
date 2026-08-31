import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  DollarSign,
  Landmark,
  PieChart as PieIcon,
  Plus,
  Receipt,
  Sparkles,
  Trash2,
  TrendingUp,
  Utensils,
  Car,
  Bed,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import api from '../api/client'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

const CATEGORY_COLORS = {
  transport: '#54758a',
  accommodation: '#758b7b',
  activities: '#b58a4a',
  meals: '#b57b35',
  other: '#8f6a38',
}

const CATEGORY_LABELS = {
  transport: 'Transport',
  accommodation: 'Accommodation',
  activities: 'Activities',
  meals: 'Meals',
  other: 'Other',
}

const CATEGORY_ICONS = {
  transport: Car,
  accommodation: Bed,
  activities: Landmark,
  meals: Utensils,
  other: Sparkles,
}

export function TripBudgetPage() {
  const { id } = useParams()
  const [budgetData, setBudgetData] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [trip, setTrip] = useState(null)
  const [stops, setStops] = useState([])
  const [customDailyLimit, setCustomDailyLimit] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Add expense form draft
  const [expenseDraft, setExpenseDraft] = useState({
    name: '',
    category: 'meals',
    amount: '',
    date: '',
    trip_stop: '',
    notes: '',
  })

  const loadBudgetData = useCallback(async () => {
    try {
      setIsLoading(true)
      const queryParams = customDailyLimit ? `?daily_limit=${customDailyLimit}` : ''
      const [budgetRes, expensesRes, tripRes, stopsRes] = await Promise.all([
        api.get(`/trips/${id}/budget/${queryParams}`),
        api.get(`/trips/${id}/expenses/`),
        api.get(`/trips/${id}/`),
        api.get(`/trips/${id}/stops/`),
      ])

      setBudgetData(budgetRes.data)
      setExpenses(expensesRes.data.results || expensesRes.data || [])
      setTrip(tripRes.data)
      const stopsList = stopsRes.data || []
      setStops(stopsList)

      setExpenseDraft((prev) => (prev.date ? prev : { ...prev, date: tripRes.data?.start_date || '' }))
      setError('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load budget analytics. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [id, customDailyLimit])

  useEffect(() => {
    let isMounted = true
    const init = async () => {
      if (isMounted) {
        await loadBudgetData()
      }
    }
    init()
    return () => {
      isMounted = false
    }
  }, [loadBudgetData])

  const showSuccess = (msg) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(''), 3500)
  }

  const handleAddExpense = async (e) => {
    e.preventDefault()
    if (!expenseDraft.name.trim()) {
      setError('Please provide an expense title.')
      return
    }
    const numAmount = parseFloat(expenseDraft.amount)
    if (isNaN(numAmount) || numAmount < 0) {
      setError('Expense amount must be a positive number.')
      return
    }
    if (!expenseDraft.date) {
      setError('Expense date is required.')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')
      const payload = {
        name: expenseDraft.name.trim(),
        category: expenseDraft.category,
        amount: numAmount,
        currency: budgetData?.currency || 'USD',
        date: expenseDraft.date,
        trip_stop: expenseDraft.trip_stop ? parseInt(expenseDraft.trip_stop, 10) : null,
        notes: expenseDraft.notes || '',
      }

      await api.post(`/trips/${id}/expenses/`, payload)
      showSuccess(`Added expense "${expenseDraft.name}"!`)
      setExpenseDraft({
        name: '',
        category: 'meals',
        amount: '',
        date: trip?.start_date || '',
        trip_stop: '',
        notes: '',
      })
      await loadBudgetData()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add expense. Please verify dates and amount.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return
    try {
      await api.delete(`/expenses/${expenseId}/`)
      showSuccess('Expense deleted.')
      await loadBudgetData()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete expense.')
    }
  }

  // Format Recharts Pie Data
  const pieData = budgetData?.category_breakdown
    ? Object.entries(budgetData.category_breakdown)
        .filter(([, val]) => val.amount > 0)
        .map(([key, val]) => ({
          name: CATEGORY_LABELS[key] || key,
          value: val.amount,
          percentage: val.percentage,
          color: CATEGORY_COLORS[key] || '#9ca3af',
        }))
    : []

  // Format Recharts Bar Data
  const barData = budgetData?.daily_breakdown
    ? budgetData.daily_breakdown.map((d) => ({
        date: d.date.slice(5), // "MM-DD"
        fullDate: d.date,
        amount: d.total,
        isOverBudget: d.is_over_budget,
        itemsCount: d.items_count,
      }))
    : []

  const filteredExpenses = expenses.filter((exp) => {
    if (selectedCategoryFilter === 'all') return true
    return exp.category?.toLowerCase() === selectedCategoryFilter
  })

  return (
    <div className="trip-budget-page">
      {/* Top Header */}
      <div className="page-header-row">
        <div>
          <Link to={`/trips/${id}`} className="back-link">
            <ArrowLeft size={16} /> Back to Itinerary
          </Link>
          <h2>{trip?.name || 'Trip'} Budget & Cost Analytics</h2>
          <p className="subtext">
            Automatic cost summaries, daily spending breakdowns, and over-budget alerts.
          </p>
        </div>
        <div className="header-actions">
          <Link to={`/trips/${id}`} className="button button--secondary button--sm">
            Itinerary Builder
          </Link>
        </div>
      </div>

      {error ? (
        <div className="alert-banner error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      {successMessage ? (
        <div className="alert-banner success" role="alert">
          <span>{successMessage}</span>
        </div>
      ) : null}

      {isLoading && !budgetData ? (
        <p>Loading budget analytics...</p>
      ) : (
        <>
          {/* Over-Budget Day Alert Banner */}
          {budgetData?.over_budget_days && budgetData.over_budget_days.length > 0 ? (
            <div className="alert-banner warning-banner" role="alert">
              <AlertTriangle size={20} className="warning-icon" />
              <div className="warning-content">
                <strong>Over-Budget Day Alert</strong>
                <p>
                  Spending spiked on{' '}
                  {budgetData.over_budget_days
                    .map((d) => `${d.date} ($${d.total.toFixed(2)})`)
                    .join(', ')}{' '}
                  exceeding the daily limit of ${budgetData.daily_threshold.toFixed(2)}.
                </p>
              </div>
            </div>
          ) : null}

          {/* Metric Cards Grid */}
          <div className="budget-metrics-grid">
            <Card className="metric-card">
              <span className="eyebrow">Total Spend</span>
              <p className="metric-value">
                <DollarSign size={22} />
                {budgetData?.total?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || '0.00'}
              </p>
              <span className="metric-sub">{budgetData?.currency || 'USD'} Total</span>
            </Card>

            <Card className="metric-card">
              <span className="eyebrow">Average Cost / Day</span>
              <p className="metric-value">
                <DollarSign size={22} />
                {budgetData?.average_per_day?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || '0.00'}
              </p>
              <span className="metric-sub">Across {budgetData?.days_count || 1} Days</span>
            </Card>

            <Card className="metric-card">
              <span className="eyebrow">Daily Spending Threshold</span>
              <div className="threshold-input-row">
                <span className="threshold-prefix">$</span>
                <input
                  type="number"
                  min="0"
                  className="input-field input-compact"
                  placeholder={String(budgetData?.daily_threshold || 'Auto')}
                  value={customDailyLimit}
                  onChange={(e) => setCustomDailyLimit(e.target.value)}
                  onBlur={() => loadBudgetData()}
                  title="Enter custom daily budget target"
                />
              </div>
              <span className="metric-sub">Alerts trigger above this</span>
            </Card>

            <Card className="metric-card">
              <span className="eyebrow">Expenses Logged</span>
              <p className="metric-value">
                <Receipt size={22} />
                {budgetData?.expenses_count || 0}
              </p>
              <span className="metric-sub">Individual Line Items</span>
            </Card>
          </div>

          {/* Visual Charts Row */}
          <div className="charts-grid">
            {/* Category Breakdown Donut */}
            <Card title="Category Spending Distribution" className="chart-card">
              {pieData.length > 0 ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => [`$${Number(val).toFixed(2)}`, 'Cost']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="empty-chart-state">
                  <PieIcon size={40} className="empty-icon" />
                  <p>No categorized expenses logged yet.</p>
                </div>
              )}
            </Card>

            {/* Daily Spending Trend Bar Chart */}
            <Card title="Daily Spending Trend" className="chart-card">
              {barData.length > 0 ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(val) => [`$${Number(val).toFixed(2)}`, 'Total Spent']}
                        labelFormatter={(lbl) => `Date: ${lbl}`}
                      />
                      {budgetData?.daily_threshold > 0 ? (
                        <ReferenceLine
                          y={budgetData.daily_threshold}
                          stroke="#ef4444"
                          strokeDasharray="3 3"
                          label={{ value: 'Daily Limit', fill: '#ef4444', fontSize: 11 }}
                        />
                      ) : null}
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                        {barData.map((entry, index) => (
                          <Cell
                            key={`bar-${index}`}
                            fill={entry.isOverBudget ? '#ef4444' : '#7c3aed'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="empty-chart-state">
                  <TrendingUp size={40} className="empty-icon" />
                  <p>Daily timeline will appear once trip dates are set.</p>
                </div>
              )}
            </Card>
          </div>

          {/* Add Expense Form & Log */}
          <div className="budget-management-grid">
            {/* Add Expense Card */}
            <Card title="Log New Expense" className="add-expense-card">
              <form onSubmit={handleAddExpense} className="stack-form">
                <label>
                  <span>Expense Description</span>
                  <input
                    className="input-field"
                    placeholder="e.g. Flight tickets, Hotel booking, Dinner in Trastevere"
                    value={expenseDraft.name}
                    onChange={(e) => setExpenseDraft({ ...expenseDraft, name: e.target.value })}
                    required
                  />
                </label>

                <div className="stop-form-grid">
                  <label>
                    <span>Category</span>
                    <select
                      className="input-field"
                      value={expenseDraft.category}
                      onChange={(e) => setExpenseDraft({ ...expenseDraft, category: e.target.value })}
                    >
                      <option value="transport">Transport (Flights, Transit)</option>
                      <option value="accommodation">Accommodation (Hotels, Airbnbs)</option>
                      <option value="activities">Activities (Museums, Tours)</option>
                      <option value="meals">Meals (Dining, Groceries)</option>
                      <option value="other">Other (Shopping, Tips)</option>
                    </select>
                  </label>

                  <label>
                    <span>Amount ({budgetData?.currency || 'USD'})</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input-field"
                      placeholder="0.00"
                      value={expenseDraft.amount}
                      onChange={(e) => setExpenseDraft({ ...expenseDraft, amount: e.target.value })}
                      required
                    />
                  </label>
                </div>

                <div className="stop-form-grid">
                  <label>
                    <span>Date</span>
                    <input
                      type="date"
                      className="input-field"
                      min={trip?.start_date || undefined}
                      max={trip?.end_date || undefined}
                      value={expenseDraft.date}
                      onChange={(e) => setExpenseDraft({ ...expenseDraft, date: e.target.value })}
                      required
                    />
                  </label>

                  <label>
                    <span>Associated Stop (optional)</span>
                    <select
                      className="input-field"
                      value={expenseDraft.trip_stop}
                      onChange={(e) => setExpenseDraft({ ...expenseDraft, trip_stop: e.target.value })}
                    >
                      <option value="">-- General Trip Expense --</option>
                      {stops.map((stop) => (
                        <option key={stop.id} value={stop.id}>
                          {stop.city_name || (typeof stop.city === 'string' ? stop.city : 'Stop')}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  <span>Notes (optional)</span>
                  <input
                    className="input-field"
                    placeholder="Confirmation numbers, receipt details..."
                    value={expenseDraft.notes}
                    onChange={(e) => setExpenseDraft({ ...expenseDraft, notes: e.target.value })}
                  />
                </label>

                <Button type="submit" disabled={isSubmitting}>
                  <Plus size={16} /> Add Expense
                </Button>
              </form>
            </Card>

            {/* Expense Log */}
            <Card title="Logged Expenses" className="expenses-log-card">
              {/* Category Filter Chips */}
              <div className="category-filter-chips">
                <button
                  type="button"
                  className={`chip ${selectedCategoryFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedCategoryFilter('all')}
                >
                  All ({expenses.length})
                </button>
                {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
                  <button
                    key={catKey}
                    type="button"
                    className={`chip ${selectedCategoryFilter === catKey ? 'active' : ''}`}
                    onClick={() => setSelectedCategoryFilter(catKey)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {filteredExpenses.length > 0 ? (
                <div className="expenses-table-wrap">
                  <table className="expenses-table">
                    <thead>
                      <tr>
                        <th>Expense</th>
                        <th>Category</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((exp) => {
                        const Icon = CATEGORY_ICONS[exp.category] || Sparkles
                        return (
                          <tr key={exp.id}>
                            <td>
                              <strong>{exp.name}</strong>
                              {exp.stop_name ? (
                                <span className="expense-stop-sub">{exp.stop_name}</span>
                              ) : null}
                            </td>
                            <td>
                              <span className={`badge badge--cat badge--${exp.category}`}>
                                <Icon size={12} />
                                <span>{CATEGORY_LABELS[exp.category] || exp.category}</span>
                              </span>
                            </td>
                            <td>{exp.date}</td>
                            <td className="expense-amount">
                              ${Number(exp.amount || 0).toFixed(2)}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="icon-button danger"
                                title="Delete expense"
                                onClick={() => handleDeleteExpense(exp.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-expenses-state">
                  <Receipt size={36} className="empty-icon" />
                  <p>No expenses logged for this filter.</p>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

export default TripBudgetPage
