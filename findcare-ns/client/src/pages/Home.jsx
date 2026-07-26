import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }   from '../context/AuthContext';
import SearchBar     from '../components/SearchBar';
import AISearchBar   from '../components/AISearchBar';
import VoiceSearch   from '../components/VoiceSearch';
import MapView       from '../components/MapView';

export default function Home() {
  const [results, setResults]   = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [view, setView]         = useState('list');
  const [saved, setSaved]       = useState({});
  const navigate                = useNavigate();
  const { user, token }         = useAuth();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  async function handleSearch(filters) {
    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams();
      if (filters.city)          params.append('city',          filters.city);
      if (filters.ageRange)      params.append('ageRange',      filters.ageRange);
      if (filters.language)      params.append('language',      filters.language);
      if (filters.maxPrice)      params.append('maxPrice',      filters.maxPrice);
      if (filters.rating)        params.append('rating',        filters.rating);
      if (filters.availableOnly) params.append('availableOnly', 'true');

      if (filters.voiceQuery || filters.query) {
        params.append('city', filters.voiceQuery || filters.query);
      }

      const res  = await fetch(`${API_URL}/api/daycares?${params}`);
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
    if (!user) { navigate('/login'); return; }
    try {
      await fetch(`${API_URL}/api/auth/save-daycare`, {
        method:  'PATCH',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ daycareId })
      });
      setSaved(prev => ({ ...prev, [daycareId]: !prev[daycareId] }));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div style={styles.page}>

      {/* Hero */}
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>FindCare</h1>
        <p style={styles.heroSub}>Nova Scotia's guide to quality childcare</p>
        <div style={styles.badges}>
          <span style={styles.badge}>
            <span style={{...styles.dot, background: '#1D9E75'}}></span>
            Licensed centers only
          </span>
          <span style={styles.badge}>
            <span style={{...styles.dot, background: '#378ADD'}}></span>
            Real-time availability
          </span>
          <span style={styles.badge}>
            <span style={{...styles.dot, background: '#BA7517'}}></span>
            Parent reviews
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>

        {/* Quick links */}
        <div style={styles.quickLinks}>
          <button onClick={() => navigate('/dashboard')} style={styles.quickLink}>
            👨‍👩‍👧 Parent dashboard
          </button>
          <button onClick={() => navigate('/portal')} style={styles.quickLink}>
            🏫 Provider portal
          </button>
        </div>

        {/* Search modes */}
        <SearchBar   onSearch={handleSearch} />
        <AISearchBar onSearch={handleSearch} />
        <VoiceSearch onSearch={handleSearch} />

        {/* View toggle */}
        {searched && !loading && (
          <div style={styles.viewToggle}>
            <span style={styles.viewLabel}>View:</span>
            {['list', 'map'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  ...styles.viewBtn,
                  background: view === v ? '#1D9E75' : '#fff',
                  color:      view === v ? '#fff'    : '#374151',
                }}
              >
                {v === 'list' ? '☰ List' : '🗺️ Map'}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <p style={styles.loading}>Searching daycares...</p>
        )}

        {/* Result count */}
        {!loading && searched && (
          <p style={styles.resultCount}>
            {results.length} daycare{results.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Map view */}
        {!loading && searched && view === 'map' && (
          <MapView daycares={results} />
        )}

        {/* List view */}
        {!loading && view === 'list' && results.map(daycare => (
          <div key={daycare._id} style={styles.card}>
            <div style={styles.cardTop}>
              <h3 style={styles.cardName}>{daycare.name}</h3>
              <span style={styles.ratingBadge}>★ {daycare.rating || 'New'}</span>
            </div>
            <p style={styles.cardAddress}>
              📍 {daycare.address}, {daycare.city}
            </p>
            <div style={styles.tags}>
              {daycare.ageRange?.map(age => (
                <span key={age} style={styles.tagGreen}>{age}</span>
              ))}
              {daycare.language?.map(lang => (
                <span key={lang} style={styles.tagPurple}>{lang}</span>
              ))}
              {['infant','toddler','preschool'].map(age => {
                const spots = daycare.availability?.[age];
                if (spots === undefined) return null;
                return (
                  <span key={age} style={{
                    fontSize:     '12px',
                    padding:      '2px 8px',
                    borderRadius: '20px',
                    background:   spots > 0 ? '#E1F5EE' : '#FCEBEB',
                    color:        spots > 0 ? '#085041' : '#A32D2D',
                  }}>
                    {age}: {spots > 0 ? `${spots} open` : 'waitlist'}
                  </span>
                );
              })}
            </div>
            <div style={styles.cardFooter}>
              <span style={styles.price}>${daycare.monthlyPrice}/month</span>
              <span style={styles.hours}>{daycare.openHours}</span>
              <button
                onClick={() => handleSave(daycare._id)}
                style={{
                  ...styles.saveBtn,
                  background: saved[daycare._id] ? '#1D9E75' : '#E1F5EE',
                  color:      saved[daycare._id] ? '#fff'    : '#085041',
                }}
              >
                {saved[daycare._id] ? '♥ Saved' : '♡ Save'}
              </button>
            </div>
          </div>
        ))}

        {/* No results */}
        {!loading && searched && results.length === 0 && (
          <div style={styles.noResults}>
            <p>No daycares found. Try different search criteria.</p>
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  page:        { minHeight: '100vh', background: '#F8F7F4' },
  hero:        { background: 'linear-gradient(135deg, #1D9E75 0%, #085041 100%)', padding: '48px 16px 40px', textAlign: 'center' },
  heroTitle:   { fontSize: '48px', fontWeight: '700', color: '#fff', marginBottom: '8px' },
  heroSub:     { fontSize: '18px', color: 'rgba(255,255,255,0.85)', marginBottom: '24px' },
  badges:      { display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' },
  badge:       { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.9)' },
  dot:         { width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' },
  content:     { maxWidth: '720px', margin: '0 auto', padding: '32px 16px' },
  quickLinks:  { display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' },
  quickLink:   { padding: '10px 20px', borderRadius: '10px', border: '1px solid #E8E6E0', background: '#fff', fontSize: '14px', color: '#374151' },
  viewToggle:  { display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' },
  viewLabel:   { fontSize: '13px', color: '#6B7280' },
  viewBtn:     { padding: '6px 14px', borderRadius: '8px', border: '1px solid #E8E6E0', fontSize: '13px', cursor: 'pointer' },
  loading:     { textAlign: 'center', color: '#6B7280', fontSize: '14px', padding: '20px' },
  resultCount: { fontSize: '13px', color: '#6B7280', marginBottom: '12px' },
  card:        { background: '#fff', border: '1px solid #E8E6E0', borderRadius: '12px', padding: '16px', marginBottom: '12px' },
  cardTop:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' },
  cardName:    { fontSize: '16px', fontWeight: '500', color: '#2C2C2A' },
  ratingBadge: { fontSize: '13px', background: '#FAEEDA', color: '#854F0B', padding: '2px 10px', borderRadius: '20px' },
  cardAddress: { fontSize: '13px', color: '#6B7280', marginBottom: '10px' },
  tags:        { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' },
  tagGreen:    { fontSize: '12px', background: '#E1F5EE', color: '#0F6E56', padding: '2px 8px', borderRadius: '20px' },
  tagPurple:   { fontSize: '12px', background: '#EEEDFE', color: '#534AB7', padding: '2px 8px', borderRadius: '20px' },
  cardFooter:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #F3F4F6', fontSize: '13px', color: '#6B7280' },
  price:       { fontWeight: '500', color: '#2C2C2A' },
  hours:       { color: '#6B7280' },
  saveBtn:     { fontSize: '12px', padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '500' },
  noResults:   { textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '14px', background: '#fff', borderRadius: '12px', border: '1px solid #E8E6E0' },
};