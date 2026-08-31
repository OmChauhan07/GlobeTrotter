import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  Bookmark,
  Compass,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  Utensils,
  Landmark,
  TreePine,
  Mountain,
  Palmtree,
  PartyPopper,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import api from '../api/client'
import ActivityCard from '../components/discovery/ActivityCard'
import AddToTripModal from '../components/discovery/AddToTripModal'
import CityCard from '../components/discovery/CityCard'
import { Card } from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'

const CATEGORIES = [
  { id: '', label: 'All Experiences', icon: Sparkles },
  { id: 'culture', label: 'Culture & Art', icon: Landmark },
  { id: 'food', label: 'Food & Dining', icon: Utensils },
  { id: 'nature', label: 'Nature & Parks', icon: TreePine },
  { id: 'adventure', label: 'Adventure', icon: Mountain },
  { id: 'relaxation', label: 'Relaxation', icon: Palmtree },
  { id: 'nightlife', label: 'Nightlife', icon: PartyPopper },
]

export function DiscoveryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()

  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'cities')
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '')
  const [selectedCountry, setSelectedCountry] = useState(() => searchParams.get('country') || '')
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || '')
  const [maxCost, setMaxCost] = useState(() => searchParams.get('cost') || '')
  const [maxDuration, setMaxDuration] = useState(() => searchParams.get('duration') || '')

  const [cities, setCities] = useState([])
  const [activities, setActivities] = useState([])
  const [savedDestinations, setSavedDestinations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal State
  const [modalItem, setModalItem] = useState(null)
  const [modalItemType, setModalItemType] = useState(null)

  const fetchSavedDestinations = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const res = await api.get('/destinations/saved/')
      setSavedDestinations(res.data.results || res.data || [])
    } catch {
      // Ignored for unauthenticated or non-critical
    }
  }, [isAuthenticated])

  const executeSearch = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      if (activeTab === 'cities') {
        const params = {}
        if (searchQuery.trim()) params.q = searchQuery.trim()
        if (selectedCountry.trim()) params.country = selectedCountry.trim()
        const res = await api.get('/cities/search/', { params })
        setCities(res.data || [])
      } else if (activeTab === 'activities') {
        const params = {}
        if (searchQuery.trim()) params.city = searchQuery.trim()
        if (selectedCategory) params.category = selectedCategory
        if (maxCost) params.cost = maxCost
        if (maxDuration) params.duration = maxDuration
        const res = await api.get('/activities/search/', { params })
        setActivities(res.data || [])
      } else if (activeTab === 'saved') {
        await fetchSavedDestinations()
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Failed to load discovery results. Please check connection and try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, searchQuery, selectedCountry, selectedCategory, maxCost, maxDuration, fetchSavedDestinations])

  useEffect(() => {
    let isMounted = true
    const init = async () => {
      if (isMounted) {
        await executeSearch()
        if (isAuthenticated) {
          await fetchSavedDestinations()
        }
      }
    }
    init()
    return () => {
      isMounted = false
    }
  }, [executeSearch, fetchSavedDestinations, isAuthenticated])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    executeSearch()
  }

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey)
    setSearchParams((params) => {
      params.set('tab', tabKey)
      return params
    })
  }

  const handleExploreCityActivities = (city) => {
    setSearchQuery(city.name)
    setActiveTab('activities')
    setSearchParams({ tab: 'activities', q: city.name })
  }

  const handleToggleSaveCity = async (city) => {
    if (!isAuthenticated) {
      alert('Please log in to save and bookmark destinations.')
      return
    }

    const existingSaved = savedDestinations.find(
      (sd) => sd.city_name?.toLowerCase() === city.name.toLowerCase() || sd.city === city.id,
    )

    try {
      if (existingSaved) {
        await api.delete(`/destinations/saved/${existingSaved.id}/`)
        setSavedDestinations((current) => current.filter((s) => s.id !== existingSaved.id))
      } else {
        // Ensure city exists in DB
        const cityRes = await api.post('/cities/get-or-create/', {
          name: city.name,
          country: city.country,
          region: city.region || '',
          latitude: city.latitude,
          longitude: city.longitude,
          cost_index: city.cost_index || 0,
          popularity: city.popularity || 0,
          image_url: city.image_url || '',
          source: city.source || 'discovery',
        })
        const saveRes = await api.post('/destinations/saved/', { city: cityRes.data.id })
        setSavedDestinations((current) => [saveRes.data, ...current])
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update saved destination.')
    }
  }

  const openAddToTrip = (item, type) => {
    if (!isAuthenticated) {
      alert('Please log in to add items to your trip itinerary.')
      return
    }
    setModalItem(item)
    setModalItemType(type)
  }

  const closeModal = () => {
    setModalItem(null)
    setModalItemType(null)
  }

  return (
    <div className="discovery-page">
      <div className="discovery-hero">
        <span className="eyebrow">Explore the World</span>
        <h2>Discover Destinations & Activities</h2>
        <p className="subtext">
          Search cities with cost and popularity metrics, filter unique experiences, and add them
          directly to your travel itinerary.
        </p>

        {/* Tab Navigation */}
        <div className="discovery-tabs" role="tablist">
          <button
            type="button"
            className={`discovery-tab ${activeTab === 'cities' ? 'active' : ''}`}
            onClick={() => handleTabChange('cities')}
            role="tab"
          >
            <MapPin size={16} /> Destinations (Cities)
          </button>
          <button
            type="button"
            className={`discovery-tab ${activeTab === 'activities' ? 'active' : ''}`}
            onClick={() => handleTabChange('activities')}
            role="tab"
          >
            <Compass size={16} /> Experiences (Activities)
          </button>
          {isAuthenticated ? (
            <button
              type="button"
              className={`discovery-tab ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => handleTabChange('saved')}
              role="tab"
            >
              <Bookmark size={16} /> Saved ({savedDestinations.length})
            </button>
          ) : null}
        </div>

        {/* Search & Filter Bar */}
        <form onSubmit={handleSearchSubmit} className="discovery-search-bar">
          <div className="search-input-wrap">
            <Search size={18} className="search-icon" />
            <input
              className="input-field search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'cities'
                  ? 'Search cities or countries (e.g. Tokyo, Paris, Italy, Spain)...'
                  : 'Search experiences or city name (e.g. Paris, Cooking, Museums)...'
              }
            />
          </div>

          {activeTab === 'cities' ? (
            <input
              className="input-field filter-country"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              placeholder="Filter by country..."
            />
          ) : null}

          {activeTab === 'activities' ? (
            <div className="activity-filters-row">
              <input
                type="number"
                min="0"
                className="input-field filter-num"
                value={maxCost}
                onChange={(e) => setMaxCost(e.target.value)}
                placeholder="Max $ Cost"
              />
              <input
                type="number"
                min="0"
                className="input-field filter-num"
                value={maxDuration}
                onChange={(e) => setMaxDuration(e.target.value)}
                placeholder="Max Mins"
              />
            </div>
          ) : null}

          <button type="submit" className="button">
            Search
          </button>
        </form>

        {/* Experience Category Pills */}
        {activeTab === 'activities' ? (
          <div className="category-pills">
            {CATEGORIES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`category-pill ${selectedCategory === id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(id)
                }}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="alert-banner error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button type="button" className="button button--secondary button--sm" onClick={executeSearch}>
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      ) : null}

      {/* Results Content */}
      <div className="discovery-results">
        {isLoading ? (
          <div className="discovery-grid loading-skeleton">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="discovery-card skeleton-card">
                <div className="skeleton-image" />
                <div className="skeleton-text" />
                <div className="skeleton-text short" />
              </div>
            ))}
          </div>
        ) : activeTab === 'cities' ? (
          cities.length > 0 ? (
            <div className="discovery-grid">
              {cities.map((city, index) => (
                <CityCard
                  key={city.id || `${city.name}-${city.country}-${index}`}
                  city={city}
                  isSaved={savedDestinations.some(
                    (s) => s.city_name?.toLowerCase() === city.name.toLowerCase(),
                  )}
                  onToggleSave={handleToggleSaveCity}
                  onExploreActivities={handleExploreCityActivities}
                  onAddToTrip={(c) => openAddToTrip(c, 'city')}
                />
              ))}
            </div>
          ) : (
            <Card className="empty-discovery-state">
              <MapPin size={48} className="empty-icon" />
              <h3>No destinations found</h3>
              <p>Try searching for popular destinations like Tokyo, Paris, Rome, or Barcelona.</p>
              <div className="quick-suggestions">
                {['Paris', 'Tokyo', 'Rome', 'New York', 'Barcelona', 'Kyoto'].map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="button button--secondary button--sm"
                    onClick={() => {
                      setSearchQuery(name)
                      setSelectedCountry('')
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </Card>
          )
        ) : activeTab === 'activities' ? (
          activities.length > 0 ? (
            <div className="discovery-grid">
              {activities.map((act, index) => (
                <ActivityCard
                  key={act.id || `${act.name}-${index}`}
                  activity={act}
                  onAddToTrip={(a) => openAddToTrip(a, 'activity')}
                />
              ))}
            </div>
          ) : (
            <Card className="empty-discovery-state">
              <Compass size={48} className="empty-icon" />
              <h3>No experiences found matching your filters</h3>
              <p>Try clearing cost/duration limits or searching a different city name.</p>
              <div className="quick-suggestions">
                {['Paris', 'Tokyo', 'Rome', 'Barcelona'].map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="button button--secondary button--sm"
                    onClick={() => {
                      setSearchQuery(name)
                      setSelectedCategory('')
                      setMaxCost('')
                      setMaxDuration('')
                    }}
                  >
                    Experiences in {name}
                  </button>
                ))}
              </div>
            </Card>
          )
        ) : (
          /* Saved Destinations Tab */
          savedDestinations.length > 0 ? (
            <div className="discovery-grid">
              {savedDestinations.map((saved) => (
                <CityCard
                  key={saved.id}
                  city={{
                    id: saved.city,
                    name: saved.city_name,
                    country: saved.country,
                    image_url: saved.image_url,
                    cost_index: saved.cost_index,
                    popularity: saved.popularity,
                  }}
                  isSaved={true}
                  onToggleSave={() => handleToggleSaveCity({ name: saved.city_name, country: saved.country, id: saved.city })}
                  onExploreActivities={(c) => handleExploreCityActivities(c)}
                  onAddToTrip={(c) => openAddToTrip(c, 'city')}
                />
              ))}
            </div>
          ) : (
            <Card className="empty-discovery-state">
              <Bookmark size={48} className="empty-icon" />
              <h3>No saved destinations yet</h3>
              <p>Bookmark your favorite world destinations from the Destinations tab to access them quickly here.</p>
              <button
                type="button"
                className="button"
                onClick={() => handleTabChange('cities')}
              >
                Browse Destinations
              </button>
            </Card>
          )
        )}
      </div>

      {/* Add To Trip Modal */}
      {modalItem && modalItemType ? (
        <AddToTripModal
          item={modalItem}
          itemType={modalItemType}
          onClose={closeModal}
          onSuccess={() => {
            // Can refresh or toast
          }}
        />
      ) : null}
    </div>
  )
}

export default DiscoveryPage
