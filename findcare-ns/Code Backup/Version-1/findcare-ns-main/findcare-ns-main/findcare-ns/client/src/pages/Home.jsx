import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }   from '../context/AuthContext';
import SearchBar     from '../components/SearchBar';
import AISearchBar   from '../components/AISearchBar';
import VoiceSearch   from '../components/VoiceSearch';
import MapView       from '../components/MapView';

export default function Home() {
  const [results, setResults]     = useState([]);
  const [searched, setSearched]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [view, setView]           = useState('list');
  const [saved, setSaved]         = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const navigate                  = useNavigate();
  const { user, token }           = useAuth();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  async function handleSearch(filters) {
    setLoading(true);
    setSearched(true);
    setShowPopup(true);
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

      {/* Slim hero */}
      <div style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroLeft}>
            <h1 style={styles.heroTitle}>
              FindCare <span style={styles.heroNS}>Nova Scotia</span>
            </h1>
            <div style={styles.badges}>
              <span style={styles.badge}><span style={{...styles.dot, background: '#5DCAA5'}}></span>Licensed</span>
              <span style={styles.badge}><span style={{...styles.dot, background: '#85B7EB'}}></span>Real-time availability</span>
              <span style={styles.badge}><span style={{...styles.dot, background: '#FAC775'}}></span>Parent reviews</span>
            </div>
          </div>
          <div style={styles.heroRight}>
            <button onClick={() => navigate('/dashboard')} style={styles.heroBtn}>👨‍👩‍👧 Dashboard</button>
            <button onClick={() => navigate('/portal')}    style={styles.heroBtn}>🏫 Portal</button>
            <button onClick={() => navigate('/compare')}   style={styles.heroBtn}>⚖️ Compare</button>
          </div>
        </div>
      </div>

      {/* Search section */}
      <div style={styles.searchSection}>

        {/* Standard search — full width */}
        <div style={styles.searchBlock}>
          <div style={styles.searchBlockLabel}>🔍 Standard search</div>
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* AI + Voice — side by side same height */}
        <div style={styles.searchRow2}>
          <div style={styles.aiWrap}>
            <div style={styles.searchBlockLabel}>✨ AI smart search</div>
            <AISearchBar onSearch={handleSearch} />
          </div>
          <div style={styles.voiceWrap}>
            <div style={styles.searchBlockLabel}>🎤 Voice search</div>
            <VoiceSearch onSearch={handleSearch} />
          </div>
        </div>

      </div>

      {/* Results popup */}
      {showPopup && (
        <>
          <div onClick={() => setShowPopup(false)} style={styles.backdrop} />
          <div style={styles.popup}>
            <div style={styles.popupHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={styles.popupTitle}>
                  {loading
                    ? 'Searching...'
                    : `${results.length} daycare${results.length !== 1 ? 's' : ''} found`
                  }
                </span>
                {!loading && (
                  <div style={styles.viewToggle}>
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
              </div>
              <button onClick={() => setShowPopup(false)} style={styles.closeBtn}>✕</button>
            </div>

            <div style={styles.popupBody}>
              {loading && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                  Searching daycares...
                </div>
              )}

              {!loading && view === 'map' && <MapView daycares={results} />}

              {!loading && view === 'list' && results.map(daycare => (
                <div key={daycare._id} style={styles.card}>
                  <div style={styles.cardTop}>
                    <h3
                      style={{ ...styles.cardName, cursor: 'pointer', color: '#1D9E75' }}
                      onClick={() => { setShowPopup(false); navigate(`/daycare/${daycare._id}`); }}
                    >
                      {daycare.name}
                    </h3>
                    <span style={styles.ratingBadge}>★ {daycare.rating || 'New'}</span>
                  </div>
                  <p style={styles.cardAddress}>📍 {daycare.address}, {daycare.city}</p>
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
                          fontSize: '12px', padding: '2px 8px', borderRadius: '20px',
                          background: spots > 0 ? '#E1F5EE' : '#FCEBEB',
                          color:      spots > 0 ? '#085041' : '#A32D2D',
                        }}>
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
                          background: saved[daycare._id] ? '#1D9E75' : '#E1F5EE',
                          color:      saved[daycare._id] ? '#fff'    : '#085041',
                        }}
                      >
                        {saved[daycare._id] ? '♥ Saved' : '♡ Save'}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {!loading && searched && results.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontSize: '14px' }}>
                  No daycares found. Try different search criteria.
                </div>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
}

const styles = {
  page:             { minHeight: '100vh', background: '#F8F7F4' },
  hero:             { background: 'linear-gradient(135deg, #1D9E75 0%, #085041 100%)', padding: '12px 24px' },
  heroInner:        { maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' },
  heroLeft:         { display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
  heroTitle:        { fontSize: '22px', fontWeight: '700', color: '#fff', margin: 0 },
  heroNS:           { fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.75)', marginLeft: '6px' },
  badges:           { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  badge:            { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'rgba(255,255,255,0.85)' },
  dot:              { width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block' },
  heroRight:        { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  heroBtn:          { padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '12px', cursor: 'pointer' },
  searchSection:    { maxWidth: '1100px', margin: '0 auto', padding: '16px 24px' },
  searchBlock:      { marginBottom: '12px' },
  searchBlockLabel: { fontSize: '11px', fontWeight: '500', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' },
  searchRow2:       { display: 'flex', gap: '12px', alignItems: 'stretch' },
  aiWrap:           { flex: 2, display: 'flex', flexDirection: 'column' },
  voiceWrap:        { flex: 1, display: 'flex', flexDirection: 'column', minWidth: '200px' },
  backdrop:         { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 },
  popup:            { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '720px', maxHeight: '80vh', background: '#fff', borderRadius: '16px', zIndex: 201, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  popupHeader:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E8E6E0', flexShrink: 0 },
  popupTitle:       { fontSize: '16px', fontWeight: '500', color: '#2C2C2A' },
  viewToggle:       { display: 'flex', gap: '4px' },
  viewBtn:          { padding: '5px 12px', borderRadius: '8px', border: '1px solid #E8E6E0', fontSize: '12px', cursor: 'pointer' },
  closeBtn:         { width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #E8E6E0', background: '#F8F7F4', fontSize: '14px', color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  popupBody:        { overflowY: 'auto', padding: '16px 20px', flex: 1 },
  card:             { background: '#F8F7F4', border: '1px solid #E8E6E0', borderRadius: '12px', padding: '16px', marginBottom: '12px' },
  cardTop:          { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' },
  cardName:         { fontSize: '16px', fontWeight: '500', color: '#2C2C2A' },
  ratingBadge:      { fontSize: '13px', background: '#FAEEDA', color: '#854F0B', padding: '2px 10px', borderRadius: '20px' },
  cardAddress:      { fontSize: '13px', color: '#6B7280', marginBottom: '10px' },
  tags:             { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' },
  tagGreen:         { fontSize: '12px', background: '#E1F5EE', color: '#0F6E56', padding: '2px 8px', borderRadius: '20px' },
  tagPurple:        { fontSize: '12px', background: '#EEEDFE', color: '#534AB7', padding: '2px 8px', borderRadius: '20px' },
  cardFooter:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #E8E6E0', fontSize: '13px', color: '#6B7280' },
  price:            { fontWeight: '500', color: '#2C2C2A' },
  hours:            { color: '#6B7280' },
  saveBtn:          { fontSize: '12px', padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '500' },
};