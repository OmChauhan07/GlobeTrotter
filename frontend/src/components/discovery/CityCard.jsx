import { Bookmark, BookmarkCheck, Compass, DollarSign, MapPin, Plus, Star } from 'lucide-react'

export function CityCard({ city, onAddToTrip, onExploreActivities, isSaved, onToggleSave }) {
  const formatCostIndex = (index) => {
    if (!index || index < 2) return '$ (Budget)'
    if (index < 3.5) return '$$ (Moderate)'
    if (index < 4.2) return '$$$ (Upscale)'
    return '$$$$ (Luxury)'
  }

  const fallbackImage = 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=600&q=80'

  return (
    <div className="discovery-card city-card-item">
      <div className="discovery-card__image-wrap">
        <img
          src={city.image_url || fallbackImage}
          alt={`${city.name}, ${city.country}`}
          loading="lazy"
          onError={(e) => {
            e.target.src = fallbackImage
          }}
        />
        <div className="discovery-card__badges">
          {city.popularity ? (
            <span className="badge badge--pop">
              <Star size={12} fill="currentColor" /> {Number(city.popularity).toFixed(1)}
            </span>
          ) : null}
          <span className="badge badge--cost">
            <DollarSign size={12} /> {formatCostIndex(city.cost_index)}
          </span>
        </div>
        {onToggleSave ? (
          <button
            type="button"
            className={`discovery-card__save-btn ${isSaved ? 'saved' : ''}`}
            onClick={() => onToggleSave(city)}
            title={isSaved ? 'Remove from saved destinations' : 'Save destination'}
            aria-label={isSaved ? 'Remove from saved' : 'Save destination'}
          >
            {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          </button>
        ) : null}
      </div>

      <div className="discovery-card__body">
        <div className="discovery-card__header">
          <div>
            <h3 className="discovery-card__title">{city.name}</h3>
            <p className="discovery-card__subtitle">
              <MapPin size={13} />
              <span>
                {city.region ? `${city.region}, ` : ''}
                {city.country}
              </span>
            </p>
          </div>
        </div>

        <div className="discovery-card__actions">
          <button
            type="button"
            className="button button--secondary button--sm"
            onClick={() => onExploreActivities(city)}
          >
            <Compass size={14} /> View Experiences
          </button>
          <button
            type="button"
            className="button button--sm"
            onClick={() => onAddToTrip(city)}
          >
            <Plus size={14} /> Add to Trip
          </button>
        </div>
      </div>
    </div>
  )
}

export default CityCard
