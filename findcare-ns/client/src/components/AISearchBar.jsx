import { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const EXAMPLE_SEARCHES = [
  'Find a bilingual daycare near downtown Halifax',
  'Infant care under $800/month with open spots',
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
      onSearch({
        ...res.data.filters,
        ageRange: res.data.filters.ageRange || res.data.filters.ageGroup,
        search: res.data.filters.features || '',
      });
    } catch (err) {
      setError('AI search unavailable. Please try the standard search.');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAISearch();
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span style={styles.sparkle}>✨</span>
        <h2 style={styles.title}>AI smart search</h2>
        <span style={styles.badge}>Powered by AI</span>
      </div>
      <div style={styles.inputRow}>
        <input
          type="text"
          placeholder="Describe what you're looking for..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          style={styles.input}
        />
        <button onClick={handleAISearch} disabled={loading} style={styles.btn}>
          {loading ? '...' : '✨'}
        </button>
      </div>
      <p style={styles.exampleLabel}>Try:</p>
      <div style={styles.chips}>
        {EXAMPLE_SEARCHES.map((ex, i) => (
          <span key={i} onClick={() => setQuery(ex)} style={styles.chip}>
            "{ex}"
          </span>
        ))}
      </div>
      {parsed && (
        <div style={styles.result}>
          <p style={styles.resultTitle}>AI extracted:</p>
          <div style={styles.filterTags}>
            {parsed.city     && <span style={styles.filterTag}>📍 {parsed.city}</span>}
            {parsed.ageGroup && <span style={styles.filterTag}>👶 {parsed.ageGroup}</span>}
            {parsed.language && <span style={styles.filterTag}>🗣️ {parsed.language}</span>}
            {parsed.maxPrice && <span style={styles.filterTag}>💰 Under ${parsed.maxPrice}/mo</span>}
            {parsed.features && <span style={styles.filterTag}>⭐ {parsed.features}</span>}
          </div>
        </div>
      )}
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}

const styles = {
  wrap:        { background: '#EDE7F6', borderRadius: '12px', padding: '14px', flex: 1, border: '1.5px solid #B39DDB' },
  header:      { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' },
  sparkle:     { fontSize: '16px' },
  title:       { fontSize: '14px', fontWeight: '500', color: '#5C35CC' },
  badge:       { fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: '#7C4DFF', color: '#fff', fontWeight: '500' },
  inputRow:    { display: 'flex', gap: '6px', marginBottom: '8px' },
  input:       { flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #B39DDB', background: '#fff', fontSize: '13px', color: '#2C2C2A', outline: 'none' },
  btn:         { padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#7C4DFF', color: '#fff', fontSize: '14px', cursor: 'pointer' },
  exampleLabel:{ fontSize: '11px', color: '#5C35CC', marginBottom: '6px' },
  chips:       { display: 'flex', gap: '5px', flexWrap: 'wrap' },
  chip:        { fontSize: '11px', padding: '3px 8px', borderRadius: '20px', border: '1px solid #B39DDB', background: '#fff', color: '#5C35CC', cursor: 'pointer' },
  result:      { marginTop: '10px', padding: '10px', background: '#fff', borderRadius: '8px', border: '1px solid #B39DDB' },
  resultTitle: { fontSize: '12px', fontWeight: '500', color: '#5C35CC', marginBottom: '6px' },
  filterTags:  { display: 'flex', gap: '5px', flexWrap: 'wrap' },
  filterTag:   { fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#EDE7F6', color: '#5C35CC', border: '1px solid #B39DDB' },
  error:       { marginTop: '8px', fontSize: '12px', color: '#C62828' },
};