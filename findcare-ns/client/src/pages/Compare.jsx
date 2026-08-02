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
      <span key={i} style={{ color: i < Math.round(rating) ? '#BA7517' : '#E8E6E0' }}>★</span>
    ));
  }

  function spotStatus(daycare) {
    const total = (daycare.availability?.infant    || 0) +
                  (daycare.availability?.toddler   || 0) +
                  (daycare.availability?.preschool || 0);
    return total > 0
      ? { text: `${total} open`, color: '#085041', bg: '#E1F5EE' }
      : { text: 'Waitlist',      color: '#854F0B', bg: '#FAEEDA' };
  }

  return (
    <div style={styles.page}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
      <h1 style={styles.title}>Compare daycares</h1>
      <p style={styles.sub}>Search and select up to 3 daycares to compare side by side.</p>

      {/* Search */}
      <div style={styles.searchRow}>
        <input
          type="text"
          placeholder="Search by city e.g. Halifax..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchDaycares()}
          style={styles.input}
        />
        <button onClick={searchDaycares} style={styles.btnGreen}>Search</button>
      </div>

      {/* Selected badges */}
      {selected.length > 0 && (
        <div style={styles.selectedRow}>
          <span style={styles.selectedLabel}>Comparing:</span>
          {selected.map(d => (
            <span key={d._id} style={styles.selectedBadge}>
              {d.name}
              <span
                onClick={() => toggleSelect(d)}
                style={{ marginLeft: '6px', cursor: 'pointer', color: '#A32D2D' }}
              >×</span>
            </span>
          ))}
        </div>
      )}

      {/* Search results */}
      {loading && <p style={styles.loading}>Searching...</p>}
      {results.length > 0 && (
        <div style={styles.resultsList}>
          {results.map(daycare => {
            const isSelected = selected.find(d => d._id === daycare._id);
            return (
              <div
                key={daycare._id}
                style={{
                  ...styles.resultItem,
                  borderColor: isSelected ? '#1D9E75' : '#E8E6E0',
                  background:  isSelected ? '#E1F5EE' : '#fff',
                }}
                onClick={() => toggleSelect(daycare)}
              >
                <div style={{ flex: 1 }}>
                  <div style={styles.resultName}>{daycare.name}</div>
                  <div style={styles.resultAddr}>📍 {daycare.city} · ${daycare.monthlyPrice}/mo</div>
                </div>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  border: `2px solid ${isSelected ? '#1D9E75' : '#E8E6E0'}`,
                  background: isSelected ? '#1D9E75' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '12px'
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
          <h2 style={styles.compareTitle}>Side by side comparison</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `200px repeat(${selected.length}, minmax(0, 1fr))`,
            gap: '1px',
            background: '#E8E6E0',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>

            {/* Header row */}
            <div style={styles.headerCell}>Criteria</div>
            {selected.map(d => (
              <div key={d._id} style={{ ...styles.headerCell, color: '#1D9E75' }}>
                {d.name}
              </div>
            ))}

            {/* Monthly price */}
            <div style={styles.labelCell}>Monthly price</div>
            {selected.map(d => (
              <div key={d._id} style={styles.valueCell}>
                <span style={{ fontWeight: '500' }}>${d.monthlyPrice}</span>
                {d.monthlyPrice === Math.min(...selected.map(x => x.monthlyPrice)) && (
                  <span style={styles.bestBadge}>Lowest</span>
                )}
              </div>
            ))}

            {/* Rating */}
            <div style={styles.labelCell}>Rating</div>
            {selected.map(d => (
              <div key={d._id} style={styles.valueCell}>
                <div style={{ display: 'flex', gap: '1px', fontSize: '14px' }}>
                  {renderStars(d.rating)}
                </div>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>{d.rating || 'New'}</span>
              </div>
            ))}

            {/* Availability */}
            <div style={styles.labelCell}>Availability</div>
            {selected.map(d => {
              const s = spotStatus(d);
              return (
                <div key={d._id} style={styles.valueCell}>
                  <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: '20px', fontSize: '12px' }}>
                    {s.text}
                  </span>
                </div>
              );
            })}

            {/* Age groups */}
            <div style={styles.labelCell}>Age groups</div>
            {selected.map(d => (
              <div key={d._id} style={{ ...styles.valueCell, flexWrap: 'wrap', gap: '4px' }}>
                {d.ageRange?.map(age => (
                  <span key={age} style={{ background: '#E1F5EE', color: '#085041', padding: '2px 6px', borderRadius: '20px', fontSize: '11px' }}>
                    {age}
                  </span>
                ))}
              </div>
            ))}

            {/* Languages */}
            <div style={styles.labelCell}>Languages</div>
            {selected.map(d => (
              <div key={d._id} style={{ ...styles.valueCell, flexWrap: 'wrap', gap: '4px' }}>
                {d.language?.map(lang => (
                  <span key={lang} style={{ background: '#EEEDFE', color: '#534AB7', padding: '2px 6px', borderRadius: '20px', fontSize: '11px' }}>
                    {lang}
                  </span>
                ))}
              </div>
            ))}

            {/* Open hours */}
            <div style={styles.labelCell}>Open hours</div>
            {selected.map(d => (
              <div key={d._id} style={styles.valueCell}>
                <span style={{ fontSize: '13px' }}>{d.openHours}</span>
              </div>
            ))}

            {/* Reviews */}
            <div style={styles.labelCell}>Reviews</div>
            {selected.map(d => (
              <div key={d._id} style={styles.valueCell}>
                <span style={{ fontSize: '13px' }}>{d.reviewCount || 0} reviews</span>
              </div>
            ))}

            {/* Action */}
            <div style={styles.labelCell}>View profile</div>
            {selected.map(d => (
              <div key={d._id} style={styles.valueCell}>
                <button
                  onClick={() => navigate(`/daycare/${d._id}`)}
                  style={styles.btnGreen}
                >
                  View →
                </button>
              </div>
            ))}

          </div>
        </div>
      )}

      {selected.length === 1 && (
        <p style={styles.hint}>Select one more daycare to start comparing.</p>
      )}
      {selected.length === 0 && results.length > 0 && (
        <p style={styles.hint}>Click any daycare above to select it for comparison.</p>
      )}

    </div>
  );
}

const styles = {
  page:         { maxWidth: '900px', margin: '0 auto', padding: '24px 16px', background: '#F8F7F4', minHeight: '100vh' },
  backBtn:      { fontSize: '13px', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', padding: '0' },
  title:        { fontSize: '24px', fontWeight: '500', color: '#2C2C2A', marginBottom: '4px' },
  sub:          { fontSize: '14px', color: '#6B7280', marginBottom: '20px' },
  searchRow:    { display: 'flex', gap: '8px', marginBottom: '16px' },
  input:        { flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #E8E6E0', fontSize: '14px', color: '#2C2C2A', background: '#fff' },
  btnGreen:     { padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#1D9E75', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
  selectedRow:  { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' },
  selectedLabel:{ fontSize: '13px', color: '#6B7280' },
  selectedBadge:{ fontSize: '13px', background: '#E1F5EE', color: '#085041', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center' },
  loading:      { textAlign: 'center', color: '#6B7280', padding: '20px' },
  resultsList:  { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' },
  resultItem:   { display: 'flex', alignItems: 'center', padding: '12px 14px', borderRadius: '10px', border: '1px solid', cursor: 'pointer' },
  resultName:   { fontSize: '14px', fontWeight: '500', color: '#2C2C2A' },
  resultAddr:   { fontSize: '12px', color: '#6B7280', marginTop: '2px' },
  compareWrap:  { background: '#fff', borderRadius: '12px', border: '1px solid #E8E6E0', padding: '20px', marginTop: '8px' },
  compareTitle: { fontSize: '16px', fontWeight: '500', color: '#2C2C2A', marginBottom: '16px' },
  headerCell:   { background: '#2C2C2A', color: '#fff', padding: '12px 14px', fontSize: '13px', fontWeight: '500' },
  labelCell:    { background: '#F8F7F4', padding: '12px 14px', fontSize: '13px', color: '#6B7280', fontWeight: '500' },
  valueCell:    { background: '#fff', padding: '12px 14px', fontSize: '13px', color: '#2C2C2A', display: 'flex', alignItems: 'center', gap: '6px' },
  bestBadge:    { fontSize: '10px', background: '#E1F5EE', color: '#085041', padding: '1px 6px', borderRadius: '20px', marginLeft: '4px' },
  hint:         { textAlign: 'center', color: '#6B7280', fontSize: '14px', padding: '20px' },
};
