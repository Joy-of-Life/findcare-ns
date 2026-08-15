import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Compare() {
  const [search, setSearch]     = useState('');
  const [results, setResults]   = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading]   = useState(false);
  const navigate                = useNavigate();

  async function searchDaycares() {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/daycares?city=${search}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(daycare) {
    if (selected.find(d => d._id === daycare._id)) {
      setSelected(prev => prev.filter(d => d._id !== daycare._id));
    } else if (selected.length < 3) {
      setSelected(prev => [...prev, daycare]);
    }
  }

  function renderStars(rating) {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < Math.round(rating) ? '#FF6B35' : '#FFE0B2' }}>★</span>
    ));
  }

  function spotStatus(daycare) {
    const total = (daycare.availability?.infant    || 0) +
                  (daycare.availability?.toddler   || 0) +
                  (daycare.availability?.preschool || 0);
    return total > 0
      ? { text: `${total} open`, color: '#2E7D32', bg: '#E8F5E9' }
      : { text: 'Waitlist',      color: '#E65100', bg: '#FFF3E0' };
  }

  return (
    <div style={styles.page}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
      <h1 style={styles.title}>⚖️ Compare daycares</h1>
      <p style={styles.sub}>Search and select up to 3 daycares to compare side by side.</p>

      {/* Search */}
      <div style={styles.searchRow}>
        <input
          type="text"
          placeholder="🔍 Search by city e.g. Halifax..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchDaycares()}
          style={styles.input}
        />
        <button onClick={searchDaycares} style={styles.btnOrange}>Search</button>
      </div>

      {/* Selected badges */}
      {selected.length > 0 && (
        <div style={styles.selectedRow}>
          <span style={styles.selectedLabel}>Comparing:</span>
          {selected.map(d => (
            <span key={d._id} style={styles.selectedBadge}>
              {d.name}
              <span onClick={() => toggleSelect(d)} style={{ marginLeft: '6px', cursor: 'pointer', color: '#C62828' }}>×</span>
            </span>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && <p style={styles.loading}>🔍 Searching...</p>}

      {/* Search results */}
      {results.length > 0 && (
        <div style={styles.resultsList}>
          {results.map(daycare => {
            const isSelected = selected.find(d => d._id === daycare._id);
            return (
              <div
                key={daycare._id}
                style={{
                  ...styles.resultItem,
                  borderColor: isSelected ? '#FF6B35' : '#FFE0B2',
                  background:  isSelected ? '#FFF3E0' : '#fff',
                }}
                onClick={() => toggleSelect(daycare)}
              >
                <div style={{ flex: 1 }}>
                  <div style={styles.resultName}>{daycare.name}</div>
                  <div style={styles.resultAddr}>📍 {daycare.city} · ${daycare.monthlyPrice}/mo</div>
                </div>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  border: `2px solid ${isSelected ? '#FF6B35' : '#FFCC80'}`,
                  background: isSelected ? '#FF6B35' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '12px', fontWeight: '700',
                }}>
                  {isSelected ? '✓' : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comparison table */}
      {selected.length >= 2 && (
        <div style={styles.compareWrap}>
          <h2 style={styles.compareTitle}>📊 Side by side comparison</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `180px repeat(${selected.length}, minmax(0, 1fr))`,
            gap: '1px',
            background: '#FFE0B2',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>

            {/* Header */}
            <div style={styles.headerCell}>Criteria</div>
            {selected.map(d => (
              <div key={d._id} style={{ ...styles.headerCell, color: '#FF6B35' }}>{d.name}</div>
            ))}

            {/* Price */}
            <div style={styles.labelCell}>💰 Monthly price</div>
            {selected.map(d => (
              <div key={d._id} style={styles.valueCell}>
                <span style={{ fontWeight: '600' }}>${d.monthlyPrice}</span>
                {d.monthlyPrice === Math.min(...selected.map(x => x.monthlyPrice)) && (
                  <span style={styles.bestBadge}>Lowest 🎉</span>
                )}
              </div>
            ))}

            {/* Rating */}
            <div style={styles.labelCell}>⭐ Rating</div>
            {selected.map(d => (
              <div key={d._id} style={styles.valueCell}>
                <div style={{ display: 'flex', gap: '1px', fontSize: '14px' }}>{renderStars(d.rating)}</div>
                <span style={{ fontSize: '12px', color: '#9E9E9E' }}>{d.rating || 'New'}</span>
              </div>
            ))}

            {/* Availability */}
            <div style={styles.labelCell}>🎈 Availability</div>
            {selected.map(d => {
              const s = spotStatus(d);
              return (
                <div key={d._id} style={styles.valueCell}>
                  <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: '20px', fontSize: '12px', border: `1px solid ${s.color}30` }}>
                    {s.text}
                  </span>
                </div>
              );
            })}

            {/* Age groups */}
            <div style={styles.labelCell}>👶 Age groups</div>
            {selected.map(d => (
              <div key={d._id} style={{ ...styles.valueCell, flexWrap: 'wrap', gap: '4px' }}>
                {d.ageRange?.map(age => (
                  <span key={age} style={{ background: '#FFF3E0', color: '#E65100', padding: '2px 6px', borderRadius: '20px', fontSize: '11px', border: '1px solid #FFCC80' }}>
                    {age}
                  </span>
                ))}
              </div>
            ))}

            {/* Languages */}
            <div style={styles.labelCell}>🗣️ Languages</div>
            {selected.map(d => (
              <div key={d._id} style={{ ...styles.valueCell, flexWrap: 'wrap', gap: '4px' }}>
                {d.language?.map(lang => (
                  <span key={lang} style={{ background: '#EDE7F6', color: '#5C35CC', padding: '2px 6px', borderRadius: '20px', fontSize: '11px', border: '1px solid #B39DDB' }}>
                    {lang}
                  </span>
                ))}
              </div>
            ))}

            {/* Hours */}
            <div style={styles.labelCell}>🕐 Open hours</div>
            {selected.map(d => (
              <div key={d._id} style={styles.valueCell}>
                <span style={{ fontSize: '12px' }}>{d.openHours}</span>
              </div>
            ))}

            {/* Reviews */}
            <div style={styles.labelCell}>💬 Reviews</div>
            {selected.map(d => (
              <div key={d._id} style={styles.valueCell}>
                <span style={{ fontSize: '13px' }}>{d.reviewCount || 0} reviews</span>
              </div>
            ))}

            {/* Action */}
            <div style={styles.labelCell}>👀 View</div>
            {selected.map(d => (
              <div key={d._id} style={styles.valueCell}>
                <button onClick={() => navigate(`/daycare/${d._id}`)} style={styles.btnOrange}>
                  View →
                </button>
              </div>
            ))}

          </div>
        </div>
      )}

      {selected.length === 1 && (
        <p style={styles.hint}>👆 Select one more daycare to start comparing.</p>
      )}
      {selected.length === 0 && results.length > 0 && (
        <p style={styles.hint}>👆 Click any daycare above to select it for comparison.</p>
      )}

    </div>
  );
}

const styles = {
  page:          { maxWidth: '900px', margin: '0 auto', padding: '24px 16px', background: '#FFFDF9', minHeight: '100vh' },
  backBtn:       { fontSize: '13px', color: '#9E9E9E', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', padding: '0' },
  title:         { fontSize: '24px', fontWeight: '700', color: '#2C2C2A', marginBottom: '4px' },
  sub:           { fontSize: '14px', color: '#9E9E9E', marginBottom: '20px' },
  searchRow:     { display: 'flex', gap: '8px', marginBottom: '16px' },
  input:         { flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #FFCC80', fontSize: '14px', color: '#2C2C2A', background: '#fff', outline: 'none' },
  btnOrange:     { padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#FF6B35', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  selectedRow:   { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' },
  selectedLabel: { fontSize: '13px', color: '#9E9E9E' },
  selectedBadge: { fontSize: '13px', background: '#FFF3E0', color: '#E65100', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', border: '1px solid #FFCC80' },
  loading:       { textAlign: 'center', color: '#FF6B35', padding: '20px' },
  resultsList:   { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' },
  resultItem:    { display: 'flex', alignItems: 'center', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid', cursor: 'pointer' },
  resultName:    { fontSize: '14px', fontWeight: '600', color: '#2C2C2A' },
  resultAddr:    { fontSize: '12px', color: '#9E9E9E', marginTop: '2px' },
  compareWrap:   { background: '#fff', borderRadius: '16px', border: '1.5px solid #FFE0B2', padding: '20px', marginTop: '8px' },
  compareTitle:  { fontSize: '16px', fontWeight: '600', color: '#2C2C2A', marginBottom: '16px' },
  headerCell:    { background: '#2C2C2A', color: '#fff', padding: '12px 14px', fontSize: '13px', fontWeight: '600' },
  labelCell:     { background: '#FFF3E0', padding: '12px 14px', fontSize: '13px', color: '#E65100', fontWeight: '500' },
  valueCell:     { background: '#fff', padding: '12px 14px', fontSize: '13px', color: '#2C2C2A', display: 'flex', alignItems: 'center', gap: '6px' },
  bestBadge:     { fontSize: '10px', background: '#E8F5E9', color: '#2E7D32', padding: '1px 6px', borderRadius: '20px', marginLeft: '4px', border: '1px solid #A5D6A7' },
  hint:          { textAlign: 'center', color: '#9E9E9E', fontSize: '14px', padding: '20px' },
};