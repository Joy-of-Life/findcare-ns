import { useState } from 'react';
import { AGE_GROUP_OPTIONS, AVAILABILITY_AGE_GROUPS } from '../constants/ageGroups';
import './SearchBar.css';

export default function SearchBar({ onSearch }) {
  const [query, setQuery]                 = useState('');
  const [ageRange, setAgeRange]           = useState('');
  const [language, setLanguage]           = useState('');
  const [maxPrice, setMaxPrice]           = useState('');
  const [rating, setRating]               = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [showFilters, setShowFilters]     = useState(false);

  function handleSearch() {
    onSearch({ query, ageRange, language, maxPrice, rating, availableOnly });
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSearch();
  }

  return (
    <div className="findcare-search" style={styles.wrap}>
      <div className="findcare-search__field" style={styles.inputWrap}>
        <svg style={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        <input
          type="text"
          className="findcare-search__input"
          aria-label="Search by daycare or location"
          placeholder="Enter city, postal code, or address..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          style={styles.input}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            style={styles.clearBtn}
            aria-label="Clear search text"
            title="Clear search text"
          >
            ×
          </button>
        )}

        <button
          type="button"
          className="findcare-search__filter-toggle"
          onClick={() => setShowFilters(value => !value)}
          style={styles.filterToggle}
          aria-label="Toggle search filters"
          aria-expanded={showFilters}
          aria-controls="findcare-search-filters"
          title="Filters"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h9m4 0h3M4 17h3m4 0h9" />
            <circle cx="15" cy="7" r="2" />
            <circle cx="9" cy="17" r="2" />
          </svg>
        </button>

        <button type="button" className="findcare-search__submit" onClick={handleSearch} style={styles.btn}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <span>Search</span>
        </button>
      </div>

      {showFilters && (
        <div id="findcare-search-filters" className="findcare-search__filters" style={styles.filtersRow}>
          <select aria-label="Age group" value={ageRange} onChange={e => {
            setAgeRange(e.target.value);
            if (!AVAILABILITY_AGE_GROUPS.includes(e.target.value)) setAvailableOnly(false);
          }} style={styles.select}>
            <option value="">Age group</option>
            {AGE_GROUP_OPTIONS.map(({ value, label, range }) => (
              <option key={value} value={value}>{label} ({range})</option>
            ))}
          </select>

          <select aria-label="Language" value={language} onChange={e => setLanguage(e.target.value)} style={styles.select}>
            <option value="">Language</option>
            <option value="English">English</option>
            <option value="French">French</option>
            <option value="Arabic">Arabic</option>
            <option value="Mandarin">Mandarin</option>
            <option value="Spanish">Spanish</option>
          </select>

          <select aria-label="Maximum monthly price" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} style={styles.select}>
            <option value="">Any price</option>
            <option value="600">Under $600</option>
            <option value="700">Under $700</option>
            <option value="800">Under $800</option>
            <option value="900">Under $900</option>
            <option value="1000">Under $1000</option>
          </select>

          <select aria-label="Minimum rating" value={rating} onChange={e => setRating(e.target.value)} style={styles.select}>
            <option value="">Any rating</option>
            <option value="3">3+ stars</option>
            <option value="4">4+ stars</option>
            <option value="4.5">4.5+ stars</option>
          </select>

          {AVAILABILITY_AGE_GROUPS.includes(ageRange) && (
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
      )}
    </div>
  );
}

const styles = {
  wrap: { background: '#FFFDF7', borderRadius: '17px', padding: '5px', border: '1px solid rgba(255, 255, 255, 0.84)', boxShadow: '0 8px 22px rgba(24, 20, 15, 0.13)' },
  inputWrap: { display: 'flex', alignItems: 'center', gap: '8px', minHeight: '56px', padding: '0 7px', borderRadius: '12px', border: 'none', background: 'transparent', transition: 'box-shadow 180ms ease' },
  icon: { width: '21px', height: '21px', flexShrink: 0, margin: '0 4px', stroke: '#A7A29B', strokeWidth: '1.8', fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' },
  input: { flex: 1, minWidth: 0, border: 'none', background: 'transparent', fontSize: '15px', color: '#2C2C2A', outline: 'none' },
  clearBtn: { border: 'none', background: 'transparent', color: '#777', fontSize: '22px', lineHeight: 1, cursor: 'pointer', padding: '4px' },
  filterToggle: { width: '42px', height: '42px', display: 'grid', placeItems: 'center', flexShrink: 0, border: 'none', borderLeft: '1px solid #E7E1D7', borderRadius: 0, background: 'transparent', color: '#777', cursor: 'pointer' },
  filtersRow: { position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 'min(100%, 620px)', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px', padding: '16px', border: '1px solid #E3D9C9', borderRadius: '14px', background: '#FFF9EA', boxShadow: '0 14px 30px rgba(24, 20, 15, 0.2)' },
  select: { minWidth: 0, padding: '10px 12px', borderRadius: '9px', border: '1px solid #D8CCBC', background: '#fff', fontSize: '13px', color: '#555', cursor: 'pointer' },
  checkLabel: { gridColumn: '1 / -1', display: 'flex', alignItems: 'center', fontSize: '13px', color: '#5C625D', cursor: 'pointer', fontWeight: '500' },
  btn: { minWidth: '144px', height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0 20px', flexShrink: 0, background: '#FF665F', color: '#fff', border: 'none', borderRadius: '11px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 3px 8px rgba(255, 102, 95, 0.18)', transition: 'background 180ms ease, box-shadow 180ms ease, transform 180ms ease' },
};