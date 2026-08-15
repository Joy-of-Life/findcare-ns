import { useState } from 'react';

export default function SearchBar({ onSearch }) {
  const [city, setCity]                   = useState('');
  const [ageRange, setAgeRange]           = useState('');
  const [language, setLanguage]           = useState('');
  const [maxPrice, setMaxPrice]           = useState('');
  const [rating, setRating]               = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  function handleSearch() {
    onSearch({ city, ageRange, language, maxPrice, rating, availableOnly });
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSearch();
  }

  return (
    <div style={styles.wrap}>

      {/* City input */}
      <div style={styles.inputWrap}>
        <span style={styles.icon}>📍</span>
        <input
          type="text"
          placeholder="Enter city, postal code, or address..."
          value={city}
          onChange={e => setCity(e.target.value)}
          onKeyDown={handleKeyDown}
          style={styles.input}
        />
      </div>

      {/* Filters row */}
      <div style={styles.filtersRow}>
        <select value={ageRange} onChange={e => setAgeRange(e.target.value)} style={styles.select}>
          <option value="">👶 Age group</option>
          <option value="infant">Infant (0–18mo)</option>
          <option value="toddler">Toddler (18mo–3yr)</option>
          <option value="preschool">Preschool (3–5yr)</option>
        </select>

        <select value={language} onChange={e => setLanguage(e.target.value)} style={styles.select}>
          <option value="">🗣️ Language</option>
          <option value="English">English</option>
          <option value="French">French</option>
        </select>

        <select value={maxPrice} onChange={e => setMaxPrice(e.target.value)} style={styles.select}>
          <option value="">💰 Any price</option>
          <option value="600">Under $600</option>
          <option value="700">Under $700</option>
          <option value="800">Under $800</option>
          <option value="900">Under $900</option>
          <option value="1000">Under $1000</option>
        </select>

        <select value={rating} onChange={e => setRating(e.target.value)} style={styles.select}>
          <option value="">⭐ Any rating</option>
          <option value="3">3+ stars</option>
          <option value="4">4+ stars</option>
          <option value="4.5">4.5+ stars</option>
        </select>

        {ageRange && (
          <label style={styles.checkLabel}>
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={e => setAvailableOnly(e.target.checked)}
              style={{ marginRight: '6px', accentColor: '#FF6B35' }}
            />
            Available spots only
          </label>
        )}
      </div>

      {/* Search button */}
      <button onClick={handleSearch} style={styles.btn}>
        🔍 Search daycares
      </button>

    </div>
  );
}

const styles = {
  wrap:       { background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '12px', border: '2px solid #FFE0B2' },
  inputWrap:  { display: 'flex', alignItems: 'center', border: '1.5px solid #FFCC80', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', background: '#FFFDF9' },
  icon:       { marginRight: '8px', fontSize: '16px' },
  input:      { flex: 1, border: 'none', background: 'transparent', fontSize: '15px', color: '#2C2C2A', outline: 'none' },
  filtersRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'center' },
  select:     { padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #FFCC80', background: '#FFFDF9', fontSize: '13px', color: '#555', cursor: 'pointer' },
  checkLabel: { display: 'flex', alignItems: 'center', fontSize: '13px', color: '#E65100', cursor: 'pointer', fontWeight: '500' },
  btn:        { width: '100%', padding: '12px', background: '#FF6B35', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
};