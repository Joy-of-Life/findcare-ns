import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import AISearchBar from '../components/AISearchBar';
import VoiceSearch from '../components/VoiceSearch';
import MapView from '../components/MapView';
import WelcomePopup from '../components/WelcomePopup';

export default function Home() {
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list');
  const [saved, setSaved] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  async function handleSearch(filters) {
    setLoading(true);
    setSearched(true);
    setShowPopup(true);
    try {
      const params = new URLSearchParams();
      if (filters.city) params.append('city', filters.city);
      if (filters.ageRange) params.append('ageRange', filters.ageRange);
      if (filters.language) params.append('language', filters.language);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.rating) params.append('rating', filters.rating);
      if (filters.availableOnly) params.append('availableOnly', 'true');
      if (filters.voiceQuery || filters.query) {
        params.append('city', filters.voiceQuery || filters.query);
      }
      const res = await fetch(`${API_URL}/api/daycares?${params}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(daycareId) {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await fetch(`${API_URL}/api/auth/save-daycare`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ daycareId }),
      });
      setSaved((prev) => ({ ...prev, [daycareId]: !prev[daycareId] }));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.heroWrap}>
        <div style={styles.heroInner}>
          <div style={styles.heroContent}>
            <h1 style={styles.heroTitle}>
              Find the Perfect <span style={styles.highlightWord}>Daycare</span> Near You
            </h1>
            <p style={styles.heroText}>
              Find Licensed ChildCare options across Nova Scotia — Centres and Family Homes.<br/>Filter by age group, openings, program type, and location.
            </p>
            <div style={styles.heroActions}>
              <button 
                onClick={() => setShowPopup(true)} 
                style={hoveredBtn === 'primaryHero' ? styles.primaryBtnHover : styles.primaryBtn}
                onMouseEnter={() => setHoveredBtn('primaryHero')}
                onMouseLeave={() => setHoveredBtn(null)}
              >
                Find Daycare Near Me
              </button>
              <button 
                onClick={() => navigate('/compare')} 
                style={hoveredBtn === 'secondaryHero' ? styles.secondaryBtnHover : styles.secondaryBtn}
                onMouseEnter={() => setHoveredBtn('secondaryHero')}
                onMouseLeave={() => setHoveredBtn(null)}
              >
                Start Comparing
              </button>
            </div>
          </div>

          <div style={styles.popularWrap}>
            <span style={styles.popularLabel}>Popular locations:</span>
            <div style={styles.cityGrid}>
              {['Halifax', 'Dartmouth', 'Bedford', 'Lower Sackville', 'Truro', 'New Glasgow', 'Sydney', 'Kentville'].map((city) => (
                <button 
                  key={city} 
                  style={hoveredBtn === `city-${city}` ? styles.cityBtnHover : styles.cityBtn}
                  onClick={() => handleSearch({ city })}
                  onMouseEnter={() => setHoveredBtn(`city-${city}`)}
                  onMouseLeave={() => setHoveredBtn(null)}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.statRow}>
            <div style={styles.statItem}>
              <div style={styles.metric}>0+</div>
              <div style={styles.metricLabel}>families connected</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.metric}>0+</div>
              <div style={styles.metricLabel}>licensed daycares</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.metric}>100km</div>
              <div style={styles.metricLabel}>city wide coverage</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.metric}>24/7</div>
              <div style={styles.metricLabel}>monitoring</div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.searchSection}>
        <div style={styles.searchBlock}>
          <div style={styles.searchBlockLabel}>Standard search</div>
          <SearchBar onSearch={handleSearch} />
        </div>
        <div style={styles.searchRow2}>
          <div style={styles.aiWrap}>
            <div style={styles.searchBlockLabel}>AI smart search</div>
            <AISearchBar onSearch={handleSearch} />
          </div>
          <div style={styles.voiceWrap}>
            <div style={styles.searchBlockLabel}>Voice search</div>
            <VoiceSearch onSearch={handleSearch} />
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <p style={styles.sectionEyebrow}>Why Parents Trust Findcare NS</p>
          <h2 style={styles.sectionTitle}>Built by parents, for families.</h2>
        </div>
        <div style={styles.featureGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>⏱️</div>
            <h3 style={styles.featureTitle}>Save Precious Time</h3>
            <p style={styles.featureText}>No more calling 50 daycares one by one. Search, filter, and apply in minutes — not weeks.</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>✅</div>
            <h3 style={styles.featureTitle}>Verified & Trustworthy</h3>
            <p style={styles.featureText}>Every listing is sourced from public licensing data and carefully organized for clarity.</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>💸</div>
            <h3 style={styles.featureTitle}>Find $10/Day Spots</h3>
            <p style={styles.featureText}>Instantly filter for affordable options and compare the best value near your home or work.</p>
          </div>
        </div>
      </div>

      <div style={styles.stepsWrap}>
        <div style={styles.sectionHeader}>
          <p style={styles.sectionEyebrow}>How it works</p>
          <h2 style={styles.sectionTitle}>Find Your Daycare in 3 Simple Steps</h2>
        </div>
        <div style={styles.stepsGrid}>
          <div style={styles.stepCard}>
            <div style={styles.stepBadge}>01</div>
            <h3 style={styles.stepTitle}>Search and Filter</h3>
            <p style={styles.stepText}>Use advanced search to find daycare by ward, age groups, prices, and program needs.</p>
          </div>
          <div style={styles.stepCard}>
            <div style={styles.stepBadge}>02</div>
            <h3 style={styles.stepTitle}>Set Smart Alerts</h3>
            <p style={styles.stepText}>Create custom alerts and get notified when new daycare spots open or waitlists change.</p>
          </div>
          <div style={styles.stepCard}>
            <div style={styles.stepBadge}>03</div>
            <h3 style={styles.stepTitle}>Apply and Track</h3>
            <p style={styles.stepText}>Keep all your daycare applications organized and monitor the progress in one place.</p>
          </div>
        </div>
      </div>

      <div style={styles.compareWrap}>
        <div style={styles.sectionHeader}>
          <p style={styles.sectionEyebrow}>Compare Daycares</p>
          <h2 style={styles.sectionTitle}>Compare costs, distance, features, and availability side by side.</h2>
        </div>
        <div style={styles.compareGrid}>
          <div style={styles.compareCard}>
            <div style={styles.compareIcon}>💰</div>
            <h3 style={styles.compareTitle}>Compare Costs</h3>
            <p style={styles.compareText}>See monthly fees, subsidies, and savings in one clean view.</p>
          </div>
          <div style={styles.compareCard}>
            <div style={styles.compareIcon}>📍</div>
            <h3 style={styles.compareTitle}>Compare Distance</h3>
            <p style={styles.compareText}>Choose the most convenient location based on home or work.</p>
          </div>
          <div style={styles.compareCard}>
            <div style={styles.compareIcon}>🧩</div>
            <h3 style={styles.compareTitle}>Compare Features</h3>
            <p style={styles.compareText}>Review age groups, facilities, hours, and special programs quickly.</p>
          </div>
        </div>
      </div>

      <div style={styles.storyWrap}>
        <div style={styles.sectionHeader}>
          <p style={styles.sectionEyebrow}>Parent Tips & Stories</p>
          <h2 style={styles.sectionTitle}>Helpful guidance from families across Canada.</h2>
        </div>
        <div style={styles.storyGrid}>
          {[
            'Finding Daycare Near Me: The Complete Guide for Canadian Parents (2026)',
            'Secure Your Child\'s Spot in Top Canadian Daycares for 2026',
            'The Junction Daycare Survival Guide: Waitlists, $10-a-Day, and 18-Month Reality Checks',
          ].map((title, index) => (
            <article key={title} style={styles.storyCard}>
              <div style={styles.storyBadge}>Parent Tips</div>
              <h3 style={styles.storyTitle}>{title}</h3>
              <p style={styles.storyText}>Practical notes to help families navigate waitlists, affordability, and local program availability.</p>
              <button 
                style={hoveredBtn === `story-${index}` ? styles.storyLinkHover : styles.storyLink}
                onMouseEnter={() => setHoveredBtn(`story-${index}`)}
                onMouseLeave={() => setHoveredBtn(null)}
              >
                Read More
              </button>
              {index === 0 && <div style={styles.storyAccent} />}
            </article>
          ))}
        </div>
      </div>

      <div style={styles.callout}>
        <div>
          <p style={styles.calloutEyebrow}>Never Miss a New Daycare Opening</p>
          <h3 style={styles.calloutTitle}>Get instant notifications when new openings appear in your preferred neighbourhood.</h3>
        </div>
        <button 
          onClick={() => setShowPopup(true)} 
          style={hoveredBtn === 'primaryCallout' ? styles.primaryBtnHover : styles.primaryBtn}
          onMouseEnter={() => setHoveredBtn('primaryCallout')}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          Sign Up to Get Alerts
        </button>
      </div>

      {showPopup && (
        <>
          <div onClick={() => setShowPopup(false)} style={styles.backdrop} />
          <div style={styles.popup}>
            <div style={styles.popupHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={styles.popupTitle}>
                  {loading ? 'Searching...' : `🏫 ${results.length} daycare${results.length !== 1 ? 's' : ''} found`}
                </span>
                {!loading && (
                  <div style={styles.viewToggle}>
                    {['list', 'map'].map((v) => (
                      <button
                        key={v}
                        onClick={() => setView(v)}
                        style={{
                          ...styles.viewBtn,
                          background: view === v ? '#FF6B35' : '#fff',
                          color: view === v ? '#fff' : '#555',
                          borderColor: view === v ? '#FF6B35' : '#FFCC80',
                        }}
                      >
                        {v === 'list' ? '☰ List' : '🗺️ Map'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setShowPopup(false)} style={styles.closeBtn}>✕</button>
            </div>

            <div style={styles.popupBody}>
              {loading && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#FF6B35' }}>
                  🔍 Searching daycares...
                </div>
              )}

              {!loading && view === 'map' && <MapView daycares={results} />}

              {!loading && view === 'list' && results.map((daycare) => (
                <div key={daycare._id} style={styles.card}>
                  <div style={styles.cardTop}>
                    <h3
                      style={{ ...styles.cardName, cursor: 'pointer', color: '#FF6B35' }}
                      onClick={() => {
                        setShowPopup(false);
                        navigate(`/daycare/${daycare._id}`);
                      }}
                    >
                      {daycare.name}
                    </h3>
                    <span style={styles.ratingBadge}>★ {daycare.rating || 'New'}</span>
                  </div>
                  <p style={styles.cardAddress}>📍 {daycare.address}, {daycare.city}</p>
                  <div style={styles.tags}>
                    {daycare.ageRange?.map((age) => (
                      <span key={age} style={styles.tagOrange}>{age}</span>
                    ))}
                    {daycare.language?.map((lang) => (
                      <span key={lang} style={styles.tagPurple}>{lang}</span>
                    ))}
                    {['infant', 'toddler', 'preschool'].map((age) => {
                      const spots = daycare.availability?.[age];
                      if (spots === undefined) return null;
                      return (
                        <span
                          key={age}
                          style={{
                            fontSize: '12px',
                            padding: '2px 8px',
                            borderRadius: '20px',
                            background: spots > 0 ? '#E8F5E9' : '#FFEBEE',
                            color: spots > 0 ? '#2E7D32' : '#C62828',
                          }}
                        >
                          {age}: {spots > 0 ? `${spots} open` : 'waitlist'}
                        </span>
                      );
                    })}
                  </div>
                  <div style={styles.cardFooter}>
                    <span style={styles.price}>${daycare.monthlyPrice}/month</span>
                    <span style={styles.hours}>{daycare.openHours}</span>
                    {(!user || user.role === 'parent') && (
                      <button
                        onClick={() => handleSave(daycare._id)}
                        style={{
                          ...styles.saveBtn,
                          background: saved[daycare._id] ? '#FF6B35' : '#FFF3E0',
                          color: saved[daycare._id] ? '#fff' : '#E65100',
                          border: `1px solid ${saved[daycare._id] ? '#FF6B35' : '#FFCC80'}`,
                        }}
                      >
                        {saved[daycare._id] ? '♥ Saved' : '♡ Save'}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {!loading && searched && results.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9E9E9E', fontSize: '14px' }}>
                  😕 No daycares found. Try different search criteria.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <WelcomePopup />
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#F7F4EE',
    color: '#1F2937',
  },
  heroWrap: {
    backgroundImage: "linear-gradient(135deg, rgba(245, 117, 59, 0.72), rgba(14, 31, 47, 0.5)), url('https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1600&q=80')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderBottom: '1px solid #F0D4BE',
    padding: '64px 24px 14px',
  },
  heroInner: {
    maxWidth: '1180px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '26px',
    textAlign: 'center',
  },
  heroContent: {
    maxWidth: '860px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  kicker: {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#fff4ee',
    marginBottom: '16px',
  },
  heroTitle: {
    fontSize: 'clamp(2.7rem, 4vw, 4.3rem)',
    lineHeight: 1.02,
    fontWeight: 700,
    color: '#ffffff',
    margin: '0 0 14px',
    letterSpacing: '-0.05em',
    textShadow: '0 3px 18px rgba(15, 23, 42, 0.12)',
    fontFamily: 'Recoleta, Poppins, Montserrat, serif',
    whiteSpace: 'nowrap',
  },
  highlightWord: {
    color: '#ffb399',
    textShadow: '0 3px 18px rgba(255, 120, 76, 0.25)',
  },
  heroText: {
    fontSize: '1.1rem',
    lineHeight: 1.7,
    color: 'rgba(255,255,255,0.9)',
    maxWidth: '720px',
  },
  heroActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '26px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryBtn: {
    border: 'none',
    background: 'linear-gradient(135deg, #FF6B35 0%, #E5511A 100%)',
    color: '#fff',
    fontWeight: 700,
    fontSize: '15px',
    padding: '15px 24px',
    borderRadius: '12px',
    boxShadow: '0 12px 24px rgba(240, 106, 56, 0.18)',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: 'translateY(0)',
  },
  primaryBtnHover: {
    border: 'none',
    background: 'linear-gradient(135deg, #E85A1F 0%, #D44815 100%)',
    color: '#fff',
    fontWeight: 700,
    fontSize: '15px',
    padding: '15px 24px',
    borderRadius: '12px',
    boxShadow: '0 18px 36px rgba(240, 106, 56, 0.32)',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: 'translateY(-4px)',
  },
  secondaryBtn: {
    border: '1px solid #F4C9AD',
    background: '#fff',
    color: '#1D2A39',
    fontWeight: 600,
    fontSize: '15px',
    padding: '15px 24px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: 'translateY(0)',
  },
  secondaryBtnHover: {
    border: '1px solid #E5A886',
    background: '#fffaf6',
    color: '#1D2A39',
    fontWeight: 600,
    fontSize: '15px',
    padding: '15px 24px',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 12px 28px rgba(31, 41, 55, 0.12)',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: 'translateY(-4px)',
  },
  popularWrap: {
    maxWidth: '840px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  popularLabel: {
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '15px',
  },
  cityGrid: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  cityBtn: {
    background: 'rgba(255,255,255,0.18)',
    border: '1px solid rgba(255,255,255,0.4)',
    color: '#ffffff',
    borderRadius: '999px',
    padding: '8px 14px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: 'translateY(0)',
  },
  cityBtnHover: {
    background: 'rgba(255,255,255,0.32)',
    border: '1px solid rgba(255,255,255,0.7)',
    color: '#ffffff',
    borderRadius: '999px',
    padding: '8px 14px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '13px',
    boxShadow: '0 8px 16px rgba(255, 255, 255, 0.15)',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: 'translateY(-2px)',
  },
  statRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))',
    gap: '18px',
    marginTop: '10px',
    width: '100%',
    maxWidth: '760px',
  },
  statItem: {
    padding: '18px 10px',
    background: 'rgba(255,255,255,0.38)',
    border: '1px solid rgba(243, 216, 196, 0.9)',
    borderRadius: '16px',
  },
  metric: {
    fontSize: '1.7rem',
    fontWeight: 800,
    color: '#1D2A39',
    lineHeight: 1.1,
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '12px',
    marginTop: '6px',
    fontWeight: 600,
    textTransform: 'lowercase',
  },
  searchSection: {
    maxWidth: '1180px',
    margin: '0 auto',
    padding: '20px 24px 0',
  },
  searchBlock: {
    marginBottom: '14px',
  },
  searchBlockLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#6E7280',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginBottom: '8px',
  },
  searchRow2: {
    display: 'flex',
    gap: '14px',
    alignItems: 'stretch',
    flexWrap: 'wrap',
  },
  aiWrap: {
    flex: '2 1 420px',
    display: 'flex',
    flexDirection: 'column',
  },
  voiceWrap: {
    flex: '1 1 220px',
    display: 'flex',
    flexDirection: 'column',
    minWidth: '220px',
  },
  section: {
    maxWidth: '1180px',
    margin: '0 auto',
    padding: '62px 24px 10px',
  },
  stepsWrap: {
    maxWidth: '1180px',
    margin: '0 auto',
    padding: '48px 24px 10px',
  },
  compareWrap: {
    maxWidth: '1180px',
    margin: '0 auto',
    padding: '40px 24px 10px',
  },
  storyWrap: {
    maxWidth: '1180px',
    margin: '0 auto',
    padding: '40px 24px 10px',
  },
  sectionHeader: {
    textAlign: 'center',
    maxWidth: '760px',
    margin: '0 auto 24px',
  },
  sectionEyebrow: {
    margin: 0,
    fontSize: '12px',
    color: '#F06A38',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: 700,
  },
  sectionTitle: {
    margin: '10px 0 0',
    fontSize: 'clamp(1.9rem, 3vw, 2.8rem)',
    color: '#1D2A39',
    lineHeight: 1.2,
    fontFamily: 'Recoleta, serif',
    fontWeight: 700,
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '20px',
  },
  featureCard: {
    background: '#fff',
    borderRadius: '18px',
    padding: '28px 22px',
    border: '1px solid #F3E1D4',
    boxShadow: '0 12px 28px rgba(38, 54, 70, 0.05)',
  },
  featureIcon: {
    fontSize: '2rem',
    marginBottom: '14px',
  },
  featureTitle: {
    fontSize: '1.3rem',
    marginBottom: '10px',
    color: '#1D2A39',
  },
  featureText: {
    fontSize: '0.97rem',
    lineHeight: 1.7,
    color: '#4B5563',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '20px',
  },
  stepCard: {
    background: '#FFF8F3',
    padding: '24px 20px',
    borderRadius: '18px',
    border: '1px solid #F4D7BF',
  },
  stepBadge: {
    display: 'inline-flex',
    width: '42px',
    height: '42px',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    background: '#FCEFE6',
    color: '#F06A38',
    fontWeight: 800,
    marginBottom: '12px',
  },
  stepTitle: {
    fontSize: '1.3rem',
    marginBottom: '8px',
    color: '#1D2A39',
    fontFamily: 'Recoleta, serif',
    fontWeight: 700,
  },
  stepText: {
    fontSize: '0.96rem',
    lineHeight: 1.7,
    color: '#4B5563',
  },
  compareGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '20px',
  },
  compareCard: {
    background: '#fff',
    borderRadius: '18px',
    padding: '28px 20px',
    border: '1px solid #F3E1D4',
    boxShadow: '0 12px 28px rgba(38, 54, 70, 0.05)',
  },
  compareIcon: {
    fontSize: '2rem',
    marginBottom: '12px',
  },
  compareTitle: {
    fontSize: '1.3rem',
    marginBottom: '10px',
    color: '#1D2A39',
    fontFamily: 'Recoleta, serif',
    fontWeight: 700,
  },
  compareText: {
    fontSize: '0.96rem',
    color: '#4B5563',
    lineHeight: 1.7,
  },
  storyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '20px',
  },
  storyCard: {
    background: '#fff',
    border: '1px solid #F4D7BF',
    borderRadius: '18px',
    padding: '22px',
    position: 'relative',
    overflow: 'hidden',
  },
  storyBadge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.09em',
    textTransform: 'uppercase',
    color: '#F06A38',
    marginBottom: '12px',
  },
  storyTitle: {
    fontSize: '1.3rem',
    color: '#1D2A39',
    lineHeight: 1.35,
    marginBottom: '12px',
    fontFamily: 'Recoleta, serif',
    fontWeight: 700,
  },
  storyText: {
    fontSize: '0.96rem',
    lineHeight: 1.7,
    color: '#4B5563',
    marginBottom: '14px',
  },
  storyLink: {
    background: 'transparent',
    border: 'none',
    color: '#F06A38',
    fontWeight: 700,
    padding: 0,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: 'translateX(0)',
    borderBottom: '2px solid transparent',
  },
  storyLinkHover: {
    background: 'transparent',
    border: 'none',
    color: '#E85A1F',
    fontWeight: 700,
    padding: 0,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: 'translateX(4px)',
    borderBottom: '2px solid #E85A1F',
  },
  storyAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #FFB199 0%, #FF6B35 100%)',
  },
  callout: {
    maxWidth: '1180px',
    margin: '44px auto 88px',
    padding: '28px 24px',
    background: 'linear-gradient(135deg, #1d2a39 0%, #2a405a 100%)',
    borderRadius: '22px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '18px',
    color: '#fff',
    flexWrap: 'wrap',
  },
  calloutEyebrow: {
    margin: 0,
    color: '#F7C7A8',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontSize: '12px',
    fontWeight: 700,
  },
  calloutTitle: {
    margin: '8px 0 0',
    fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
    lineHeight: 1.2,
    color: '#fff',
    maxWidth: '760px',
    fontFamily: 'Recoleta, serif',
    fontWeight: 700,
  },
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.45)',
    zIndex: 200,
  },
  popup: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '720px',
    maxHeight: '80vh',
    background: '#fff',
    borderRadius: '16px',
    zIndex: 201,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: '2px solid #FFE0B2',
  },
  popupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #FFE0B2',
    flexShrink: 0,
    background: '#FFFDF9',
  },
  popupTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2C2C2A',
  },
  viewToggle: {
    display: 'flex',
    gap: '4px',
  },
  viewBtn: {
    padding: '5px 12px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '12px',
    cursor: 'pointer',
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid #FFCC80',
    background: '#FFF3E0',
    fontSize: '14px',
    color: '#E65100',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupBody: {
    overflowY: 'auto',
    padding: '16px 20px',
    flex: 1,
  },
  card: {
    background: '#FFFDF9',
    border: '1px solid #FFE0B2',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '6px',
  },
  cardName: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#2C2C2A',
  },
  ratingBadge: {
    fontSize: '13px',
    background: '#FFF3E0',
    color: '#E65100',
    padding: '2px 10px',
    borderRadius: '20px',
    border: '1px solid #FFCC80',
  },
  cardAddress: {
    fontSize: '13px',
    color: '#6B7280',
    marginBottom: '10px',
  },
  tags: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginBottom: '10px',
  },
  tagOrange: {
    fontSize: '12px',
    background: '#FFF3E0',
    color: '#E65100',
    padding: '2px 8px',
    borderRadius: '20px',
    border: '1px solid #FFCC80',
  },
  tagPurple: {
    fontSize: '12px',
    background: '#EDE7F6',
    color: '#5C35CC',
    padding: '2px 8px',
    borderRadius: '20px',
    border: '1px solid #B39DDB',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '10px',
    borderTop: '1px solid #FFE0B2',
    fontSize: '13px',
    color: '#6B7280',
  },
  price: {
    fontWeight: '600',
    color: '#2C2C2A',
  },
  hours: {
    color: '#6B7280',
  },
  saveBtn: {
    fontSize: '12px',
    padding: '4px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
  },
};
