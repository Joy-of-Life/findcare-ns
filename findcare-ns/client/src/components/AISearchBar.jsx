import { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const EXAMPLE_SEARCHES = [
  'Find a bilingual daycare near downtown Halifax',
  'Infant care under $800/month with open spots',
  'French daycare in Dartmouth open before 7:30am',
  'Montessori program for my 3-year-old in Truro',
];

export default function AISearchBar({ onSearch }) {
  const [query, setQuery]     = useState('');
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed]   = useState(null);
  const [error, setError]     = useState('');

  async function handleAISearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setParsed(null);

    try {
      const res = await axios.post(`${API_URL}/api/ai/search`, { query });
      setParsed(res.data.filters);
      onSearch(res.data.filters);
    } catch (err) {
      setError('AI search unavailable. Please try the standard search.');
    } finally {
      setLoading(false);
    }
  }

  function fillExample(text) {
    setQuery(text);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAISearch();
  }

  return (
    <div style={styles.wrap}>

      {/* Header */}
      <div style={styles.header}>
        <span style={styles.sparkle}>✨</span>
        <h2 style={styles.title}>AI smart search</h2>
        <span style={styles.badge}>Powered by AI</span>
      </div>

      {/* Input row */}
      <div style={styles.inputRow}>
        <input
          type="text"
          placeholder="Describe what you're looking for in natural language..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          style={styles.input}
        />
        <button
          onClick={handleAISearch}
          disabled={loading}
          style={styles.btn}
        >
          {loading ? 'Searching...' : '✨ AI search'}
        </button>
      </div>

      {/* Example chips */}
      <p style={styles.exampleLabel}>Try these example searches:</p>
      <div style={styles.chips}>
        {EXAMPLE_SEARCHES.map((ex, i) => (
          <span
            key={i}
            onClick={() => fillExample(ex)}
            style={styles.chip}
          >
            "{ex}"
          </span>
        ))}
      </div>

      {/* Parsed filters result */}
      {parsed && (
        <div style={styles.result}>
          <p style={styles.resultTitle}>AI extracted these filters:</p>
          <div style={styles.filterTags}>
            {parsed.city && (
              <span style={styles.filterTag}>📍 {parsed.city}</span>
            )}
            {parsed.ageGroup && (
              <span style={styles.filterTag}>👶 {parsed.ageGroup}</span>
            )}
            {parsed.language && (
              <span style={styles.filterTag}>🗣️ {parsed.language}</span>
            )}
            {parsed.maxPrice && (
              <span style={styles.filterTag}>💰 Under ${parsed.maxPrice}/month</span>
            )}
            {parsed.openBefore && (
              <span style={styles.filterTag}>🕐 Opens before {parsed.openBefore}</span>
            )}
            {parsed.features && (
              <span style={styles.filterTag}>⭐ {parsed.features}</span>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p style={styles.error}>{error}</p>
      )}

    </div>
  );
}

const styles = {
  wrap: {
    background:   '#EEEDFE',
    borderRadius: '16px',
    padding:      '24px',
    marginBottom: '16px',
  },
  header: {
    display:     'flex',
    alignItems:  'center',
    gap:         '8px',
    marginBottom:'16px',
  },
  sparkle: {
    fontSize: '20px',
  },
  title: {
    fontSize:   '18px',
    fontWeight: '500',
    color:      '#3C3489',
  },
  badge: {
    fontSize:     '11px',
    padding:      '2px 8px',
    borderRadius: '20px',
    background:   '#534AB7',
    color:        '#fff',
    fontWeight:   '500',
  },
  inputRow: {
    display:      'flex',
    gap:          '8px',
    marginBottom: '12px',
  },
  input: {
    flex:         1,
    padding:      '10px 14px',
    borderRadius: '10px',
    border:       '1px solid #AFA9EC',
    background:   '#fff',
    fontSize:     '14px',
    color:        '#2C2C2A',
    outline:      'none',
  },
  btn: {
    padding:      '10px 18px',
    borderRadius: '10px',
    border:       'none',
    background:   '#534AB7',
    color:        '#fff',
    fontSize:     '14px',
    fontWeight:   '500',
    whiteSpace:   'nowrap',
  },
  exampleLabel: {
    fontSize:     '12px',
    color:        '#534AB7',
    marginBottom: '8px',
  },
  chips: {
    display:  'flex',
    gap:      '6px',
    flexWrap: 'wrap',
  },
  chip: {
    fontSize:     '12px',
    padding:      '5px 10px',
    borderRadius: '20px',
    border:       '1px solid #AFA9EC',
    background:   '#fff',
    color:        '#3C3489',
    cursor:       'pointer',
  },
  result: {
    marginTop:    '16px',
    padding:      '14px',
    background:   '#fff',
    borderRadius: '10px',
    border:       '1px solid #AFA9EC',
  },
  resultTitle: {
    fontSize:     '13px',
    fontWeight:   '500',
    color:        '#3C3489',
    marginBottom: '8px',
  },
  filterTags: {
    display:  'flex',
    gap:      '6px',
    flexWrap: 'wrap',
  },
  filterTag: {
    fontSize:     '12px',
    padding:      '4px 10px',
    borderRadius: '20px',
    background:   '#EEEDFE',
    color:        '#3C3489',
    border:       '1px solid #AFA9EC',
  },
  error: {
    marginTop: '10px',
    fontSize:  '13px',
    color:     '#A32D2D',
  },
};
