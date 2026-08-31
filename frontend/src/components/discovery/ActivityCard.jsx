import {
  Clock,
  Compass,
  DollarSign,
  Landmark,
  MapPin,
  Mountain,
  Palmtree,
  PartyPopper,
  Plus,
  Sparkles,
  TreePine,
  Utensils,
} from 'lucide-react'

const categoryIcons = {
  food: Utensils,
  culture: Landmark,
  nature: TreePine,
  adventure: Mountain,
  relaxation: Palmtree,
  nightlife: PartyPopper,
  other: Sparkles,
}

export function ActivityCard({ activity, onAddToTrip }) {
  const fallbackImage = 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=600&q=80'
  const CategoryIcon = categoryIcons[activity.category?.toLowerCase()] || Compass

  const formatDuration = (minutes) => {
    if (!minutes) return '1h'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const rem = minutes % 60
    return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`
  }

  return (
    <div className="discovery-card activity-card-item">
      <div className="discovery-card__image-wrap">
        <img
          src={activity.image_url || fallbackImage}
          alt={activity.name}
          loading="lazy"
          onError={(e) => {
            e.target.src = fallbackImage
          }}
        />
        <div className="discovery-card__badges">
          <span className={`badge badge--cat badge--${activity.category}`}>
            <CategoryIcon size={12} />
            <span className="badge-text">{activity.category || 'Experience'}</span>
          </span>
          <span className="badge badge--duration">
            <Clock size={12} /> {formatDuration(activity.duration)}
          </span>
        </div>
      </div>

      <div className="discovery-card__body">
        <div className="discovery-card__header">
          <h3 className="discovery-card__title" title={activity.name}>
            {activity.name}
          </h3>
          {activity.city_name ? (
            <p className="discovery-card__subtitle">
              <MapPin size={13} />
              <span>{activity.city_name}</span>
            </p>
          ) : null}
        </div>

        {activity.description ? (
          <p className="discovery-card__desc">{activity.description}</p>
        ) : null}

        <div className="discovery-card__footer">
          <div className="discovery-card__cost">
            <span className="cost-label">Est. Cost:</span>
            <span className="cost-value">
              <DollarSign size={14} />
              {Number(activity.estimated_cost || 0).toFixed(2)}
            </span>
          </div>

          <button
            type="button"
            className="button button--sm"
            onClick={() => onAddToTrip(activity)}
          >
            <Plus size={14} /> Add to Trip
          </button>
        </div>
      </div>
    </div>
  )
}

export default ActivityCard
