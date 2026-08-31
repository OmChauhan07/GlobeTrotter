import {
  ArrowRight,
  Check,
  Compass,
  Globe,
  PieChart,
  Share2,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'

const CURATED_DESTINATIONS = [
  {
    city: 'Paris',
    country: 'France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
    tag: 'Art & Gastronomy',
    stops: '4 Days',
  },
  {
    city: 'Kyoto',
    country: 'Japan',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80',
    tag: 'Culture & Nature',
    stops: '5 Days',
  },
  {
    city: 'Rome',
    country: 'Italy',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop&q=80',
    tag: 'Ancient Architecture',
    stops: '4 Days',
  },
  {
    city: 'Barcelona',
    country: 'Spain',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&auto=format&fit=crop&q=80',
    tag: 'Coastal & Modernism',
    stops: '5 Days',
  },
]

export default function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="landing-container" style={{ minHeight: '100vh', background: 'var(--color-cream)', overflowX: 'hidden' }}>
      {/* 1. Public Navbar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(252, 251, 248, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-border)',
          padding: '1.1rem 2.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'var(--color-ink)',
                color: 'var(--color-cream)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Sparkles size={18} />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.45rem',
                fontWeight: 700,
                color: 'var(--color-ink)',
                letterSpacing: '-0.02em',
              }}
            >
              GlobeTrotter
            </span>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }} className="landing-nav-links">
            <a href="#features" style={{ fontSize: '0.92rem', fontWeight: 500, color: 'var(--color-ink-soft)' }}>
              Features
            </a>
            <a href="#how-it-works" style={{ fontSize: '0.92rem', fontWeight: 500, color: 'var(--color-ink-soft)' }}>
              How It Works
            </a>
            <a href="#explore" style={{ fontSize: '0.92rem', fontWeight: 500, color: 'var(--color-ink-soft)' }}>
              Explore
            </a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isAuthenticated ? (
              <Link to="/dashboard" className="button button--accent button--sm">
                <span>Go to Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="button button--secondary button--sm">
                  Sign In
                </Link>
                <Link to="/signup" className="button button--accent button--sm">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '4.5rem 2rem 5rem',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)',
          gap: '3.5rem',
          alignItems: 'center',
        }}
        className="landing-hero-grid"
      >
        <div>
          <div className="dashboard-greeting-eyebrow" style={{ marginBottom: '0.75rem' }}>
            <Sparkles size={14} style={{ display: 'inline', marginRight: '6px' }} />
            The Intelligent Journey Planner
          </div>
          <h1
            style={{
              fontSize: 'clamp(2.75rem, 5vw, 4.25rem)',
              lineHeight: 1.1,
              marginBottom: '1.25rem',
              color: 'var(--color-ink)',
            }}
          >
            Plan less.<br />
            <em style={{ fontStyle: 'italic', color: 'var(--color-accent-dark)' }}>Travel more.</em>
          </h1>
          <p
            style={{
              fontSize: '1.15rem',
              lineHeight: 1.6,
              color: 'var(--color-ink-soft)',
              maxWidth: '540px',
              marginBottom: '2.25rem',
            }}
          >
            Build multi-city itineraries, discover unforgettable places, and keep your trip on budget —
            all in one beautifully organized workspace.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to={isAuthenticated ? '/trips/new' : '/signup'} className="button button--accent" style={{ padding: '0.9rem 1.85rem' }}>
              <span>Start Planning</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/discover" className="button button--secondary" style={{ padding: '0.9rem 1.85rem' }}>
              <Compass size={16} />
              <span>Explore Trips</span>
            </Link>
          </div>
        </div>

        {/* Hero Visual Card */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: '100%',
              height: '460px',
              borderRadius: 'var(--radius-hero)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-floating)',
              position: 'relative',
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1000&auto=format&fit=crop&q=80"
              alt="Paris sunset atmosphere"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(23, 33, 28, 0.75) 0%, rgba(23, 33, 28, 0.1) 60%, transparent 100%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '2rem',
                left: '2rem',
                right: '2rem',
                color: 'var(--color-white)',
              }}
            >
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--color-accent-border)' }}>
                Featured Itinerary
              </span>
              <h3 style={{ color: 'var(--color-white)', fontSize: '1.75rem', margin: '0.2rem 0 0.4rem' }}>
                Paris &bull; Rome &bull; Barcelona
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.9rem', margin: 0 }}>
                14 Days &bull; 3 Countries &bull; 8 Curated Stops
              </p>
            </div>
          </div>

          {/* Floating itinerary preview chip */}
          <div
            className="card"
            style={{
              position: 'absolute',
              top: '-1.5rem',
              right: '-1.5rem',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: 'var(--shadow-floating)',
              background: 'var(--color-paper)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--color-sage-soft)',
                color: 'var(--color-sage-dark)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Check size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-ink)' }}>
                Itinerary Synced
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--color-ink-light)' }}>
                Stops & Budget Calculated
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Value Strip */}
      <section
        style={{
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-paper)',
          padding: '2.25rem 2rem',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Globe size={22} color="var(--color-accent)" />
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-ink)' }}>
              Multi-City Itineraries
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <PieChart size={22} color="var(--color-sage)" />
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-ink)' }}>
              Smart Budget Intelligence
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Compass size={22} color="var(--color-accent-dark)" />
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-ink)' }}>
              Curated Experiences
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Share2 size={22} color="#54758a" />
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-ink)' }}>
              Shareable Stories
            </span>
          </div>
        </div>
      </section>

      {/* 4. Feature Showcase (Editorial Layouts) */}
      <section id="features" style={{ maxWidth: '1280px', margin: '0 auto', padding: '6rem 2rem', display: 'grid', gap: '5.5rem' }}>
        {/* Feature 1: Plan */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3.5rem', alignItems: 'center' }} className="landing-feature-row">
          <div>
            <span className="eyebrow" style={{ color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.8rem', fontWeight: 700 }}>
              01 &bull; Seamless Planning
            </span>
            <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0 1rem' }}>
              Build your journey stop by stop.
            </h2>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
              Order destinations logically, assign travel windows, schedule curated morning and evening activities,
              and re-order stops with effortless drag handles.
            </p>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Check size={18} color="var(--color-sage-dark)" />
                <span style={{ fontSize: '0.95rem' }}>Drag-and-drop stop reordering</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Check size={18} color="var(--color-sage-dark)" />
                <span style={{ fontSize: '0.95rem' }}>Interactive multi-stop timeline</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Check size={18} color="var(--color-sage-dark)" />
                <span style={{ fontSize: '0.95rem' }}>Integrated calendar views</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '2rem', background: 'var(--color-paper)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.15rem' }}>Route Timeline</h4>
              <span className="badge">3 Cities</span>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'var(--color-cream-soft)', borderRadius: '8px', borderLeft: '3px solid var(--color-accent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Paris, France</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-light)' }}>10 Sep &rarr; 14 Sep</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-soft)', marginTop: '0.25rem' }}>
                  Louvre Tour &bull; Seine Sunset Cruise
                </div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--color-cream-soft)', borderRadius: '8px', borderLeft: '3px solid var(--color-sage)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Rome, Italy</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-light)' }}>15 Sep &rarr; 19 Sep</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-soft)', marginTop: '0.25rem' }}>
                  Colosseum &bull; Trastevere Feast
                </div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--color-cream-soft)', borderRadius: '8px', borderLeft: '3px solid #54758a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Barcelona, Spain</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-light)' }}>20 Sep &rarr; 24 Sep</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-soft)', marginTop: '0.25rem' }}>
                  Sagrada Família &bull; Gothic Quarter
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Budget Intelligence */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3.5rem', alignItems: 'center' }} className="landing-feature-row">
          <div className="card" style={{ padding: '2rem', background: 'var(--color-paper)', order: 2 }} className="feature-card-second">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-ink-light)', fontWeight: 600 }}>
                  Estimated Journey Cost
                </span>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                  $2,760.00
                </div>
              </div>
              <span className="badge badge--success">On Target</span>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'var(--color-cream-soft)', borderRadius: '6px' }}>
                <span>Accommodation (3 stays)</span>
                <strong>$1,520.00</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'var(--color-cream-soft)', borderRadius: '6px' }}>
                <span>Transport & Flights</span>
                <strong>$680.00</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'var(--color-cream-soft)', borderRadius: '6px' }}>
                <span>Activities & Tickets</span>
                <strong>$260.00</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'var(--color-cream-soft)', borderRadius: '6px' }}>
                <span>Meals & Experiences</span>
                <strong>$300.00</strong>
              </div>
            </div>
          </div>

          <div style={{ order: 1 }}>
            <span className="eyebrow" style={{ color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.8rem', fontWeight: 700 }}>
              02 &bull; Financial Clarity
            </span>
            <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0 1rem' }}>
              Know what your journey will cost.
            </h2>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
              GlobeTrotter organizes expenses by category, tracks budget progress in real time, and alerts you before
              you exceed your target.
            </p>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Check size={18} color="var(--color-sage-dark)" />
                <span style={{ fontSize: '0.95rem' }}>Live categorical donut & bar chart analytics</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Check size={18} color="var(--color-sage-dark)" />
                <span style={{ fontSize: '0.95rem' }}>Per-destination expense tracking</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Check size={18} color="var(--color-sage-dark)" />
                <span style={{ fontSize: '0.95rem' }}>Multi-currency support (USD, EUR, GBP, JPY, INR)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Destination Showcase */}
      <section id="explore" style={{ background: 'var(--color-paper)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem' }}>
            <span className="eyebrow" style={{ color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.8rem', fontWeight: 700 }}>
              Atmospheric Destinations
            </span>
            <h2 style={{ fontSize: '2.75rem', margin: '0.35rem 0 0.75rem' }}>
              Go somewhere that feels like you.
            </h2>
            <p style={{ color: 'var(--color-ink-soft)', fontSize: '1.05rem' }}>
              Discover iconic capitals and serene sanctuaries with live cost metrics and curated recommendations.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {CURATED_DESTINATIONS.map((d) => (
              <div
                key={d.city}
                className="inspo-card"
                style={{
                  height: '340px',
                  borderRadius: 'var(--radius-md)',
                  backgroundImage: `url(${d.image})`,
                }}
              >
                <div className="inspo-card-content">
                  <span className="inspo-country">{d.country}</span>
                  <h3 className="inspo-city-title">{d.city}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.85rem' }}>{d.tag}</span>
                    <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#fff', backdropFilter: 'blur(4px)', border: 'none' }}>
                      {d.stops}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link to="/discover" className="button button--secondary" style={{ padding: '0.85rem 2rem' }}>
              <Compass size={16} />
              <span>Browse All Destinations & Activities</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. How It Works */}
      <section id="how-it-works" style={{ maxWidth: '1280px', margin: '0 auto', padding: '6rem 2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 4rem' }}>
          <span className="eyebrow" style={{ color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.8rem', fontWeight: 700 }}>
            Simple & Elegant
          </span>
          <h2 style={{ fontSize: '2.75rem', margin: '0.35rem 0 0.75rem' }}>
            How GlobeTrotter Works
          </h2>
          <p style={{ color: 'var(--color-ink-soft)', fontSize: '1.05rem' }}>
            From your first spark of inspiration to your journey back home.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
          <div className="card" style={{ padding: '2.5rem 2rem', position: 'relative' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 700, color: 'var(--color-accent-border)', marginBottom: '0.5rem' }}>
              01
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Choose your destinations</h3>
            <p style={{ margin: 0, color: 'var(--color-ink-soft)' }}>
              Pick cities across countries, review live cost and popularity indices, and establish your travel window.
            </p>
          </div>

          <div className="card" style={{ padding: '2.5rem 2rem', position: 'relative' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 700, color: 'var(--color-accent-border)', marginBottom: '0.5rem' }}>
              02
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Shape your itinerary</h3>
            <p style={{ margin: 0, color: 'var(--color-ink-soft)' }}>
              Add museum tours, local dining, and excursions into an interactive daily schedule with custom drag ordering.
            </p>
          </div>

          <div className="card" style={{ padding: '2.5rem 2rem', position: 'relative' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 700, color: 'var(--color-accent-border)', marginBottom: '0.5rem' }}>
              03
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Travel with confidence</h3>
            <p style={{ margin: 0, color: 'var(--color-ink-soft)' }}>
              Monitor expenses, view live calendar timelines, and share your published journey link with fellow travelers.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Final Editorial Call To Action */}
      <section style={{ maxWidth: '1280px', margin: '0 auto 6rem', padding: '0 2rem' }}>
        <div
          style={{
            background: 'var(--color-ink)',
            color: 'var(--color-white)',
            borderRadius: 'var(--radius-hero)',
            padding: '5rem 3rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', margin: '0 auto' }}>
            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--color-accent-border)' }}>
              Begin The Journey
            </span>
            <h2 style={{ color: 'var(--color-white)', fontSize: 'clamp(2.4rem, 4.5vw, 3.5rem)', margin: '0.75rem 0 1.25rem', lineHeight: 1.15 }}>
              Your next chapter is waiting.
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '1.15rem', marginBottom: '2.25rem' }}>
              Start planning something worth remembering today.
            </p>
            <Link
              to={isAuthenticated ? '/trips/new' : '/signup'}
              className="button button--accent"
              style={{ padding: '1rem 2.25rem', fontSize: '1.05rem', margin: '0 auto' }}
            >
              <Sparkles size={18} />
              <span>Plan My Trip</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-paper)', padding: '4rem 2rem 3rem' }}>
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '3rem',
            marginBottom: '3rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  background: 'var(--color-ink)',
                  color: 'var(--color-cream)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Sparkles size={16} />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700 }}>
                GlobeTrotter
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-soft)' }}>
              Crafted for travelers who appreciate beauty, clarity, and well-designed journeys.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
              Product
            </h4>
            <div style={{ display: 'grid', gap: '0.65rem', fontSize: '0.9rem', color: 'var(--color-ink-soft)' }}>
              <Link to="/discover">Discover Places</Link>
              <Link to="/trips">My Itineraries</Link>
              <a href="#how-it-works">How It Works</a>
              <Link to="/public/trips/grand-european-escape">Showcase Trip</Link>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
              Platform
            </h4>
            <div style={{ display: 'grid', gap: '0.65rem', fontSize: '0.9rem', color: 'var(--color-ink-soft)' }}>
              <Link to="/login">Sign In</Link>
              <Link to="/signup">Create Account</Link>
              <Link to="/profile">Traveler Profile</Link>
              <Link to="/admin">Admin Portal</Link>
            </div>
          </div>
        </div>

        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            paddingTop: '2rem',
            borderTop: '1px solid var(--color-border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.85rem',
            color: 'var(--color-ink-light)',
          }}
        >
          <span>&copy; {new Date().getFullYear()} GlobeTrotter. All rights reserved.</span>
          <span>Travel well. Remember more.</span>
        </div>
      </footer>
    </div>
  )
}
