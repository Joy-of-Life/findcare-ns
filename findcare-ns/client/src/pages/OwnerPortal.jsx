import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL   = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const LANGUAGES = ['English', 'French', 'Arabic', 'Mandarin', 'Spanish'];
const AGE_GROUPS = ['infant', 'toddler', 'preschool'];

export default function OwnerPortal() {
  const { user, token } = useAuth();
  const navigate        = useNavigate();

  const [form, setForm] = useState({
    name: '', address: '', city: '', phone: '',
    monthlyPrice: '', openHours: '', description: '',
    language: [], ageRange: [],
    coordinates: { lat: '', lng: '' },
    availability: { infant: 0, toddler: 0, preschool: 0 },
  });
  const [status, setStatus]   = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if not logged in or not an owner
  if (!user) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Owner portal</h2>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
            You need to be logged in as a daycare owner to access this page.
          </p>
          <button onClick={() => navigate('/login')} style={styles.btnGreen}>
            Login
          </button>
        </div>
      </div>
    );
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleCoords(e) {
    setForm({ ...form, coordinates: { ...form.coordinates, [e.target.name]: e.target.value } });
  }

  function toggleLanguage(lang) {
    const updated = form.language.includes(lang)
      ? form.language.filter(l => l !== lang)
      : [...form.language, lang];
    setForm({ ...form, language: updated });
  }

  function toggleAgeRange(age) {
    const updated = form.ageRange.includes(age)
      ? form.ageRange.filter(a => a !== age)
      : [...form.ageRange, age];
    setForm({ ...form, ageRange: updated });
  }

  function changeSpots(age, delta) {
    const next = Math.max(0, form.availability[age] + delta);
    setForm({ ...form, availability: { ...form.availability, [age]: next } });
  }

  function spotLabel(count) {
    return count === 0
      ? { text: 'waitlist', bg: '#FAEEDA', color: '#854F0B' }
      : { text: 'spots open', bg: '#E1F5EE', color: '#085041' };
  }

  async function handleSubmit() {
    if (!form.name || !form.address || !form.city || !form.phone) {
      setStatus('error');
      return;
    }
    setLoading(true);
    setStatus('');

    try {
      const res = await fetch(`${API_URL}/api/daycares`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          monthlyPrice: Number(form.monthlyPrice),
          coordinates: {
            lat: Number(form.coordinates.lat),
            lng: Number(form.coordinates.lng),
          }
        }),
      });

      if (!res.ok) throw new Error('Failed to save');
      setStatus('success');
      setForm({
        name: '', address: '', city: '', phone: '',
        monthlyPrice: '', openHours: '', description: '',
        language: [], ageRange: [],
        coordinates: { lat: '', lng: '' },
        availability: { infant: 0, toddler: 0, preschool: 0 },
      });
    } catch (err) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Provider portal</h1>
          <p style={styles.subtitle}>Register your daycare and manage real-time availability</p>
        </div>
        <span style={styles.nsBadge}>Nova Scotia</span>
      </div>

      {/* Basic info */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Basic information</h2>
        <div style={styles.grid2}>
          {[
            { label: 'Daycare name',      name: 'name',         type: 'text'   },
            { label: 'Phone',             name: 'phone',        type: 'text'   },
            { label: 'Address',           name: 'address',      type: 'text'   },
            { label: 'City',              name: 'city',         type: 'text'   },
            { label: 'Monthly price ($)', name: 'monthlyPrice', type: 'number' },
            { label: 'Open hours',        name: 'openHours',    type: 'text'   },
          ].map(f => (
            <div key={f.name} style={styles.field}>
              <label style={styles.label}>{f.label}</label>
              <input
                type={f.type}
                name={f.name}
                value={form[f.name]}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          ))}
        </div>

        <div style={{ ...styles.field, marginTop: '12px' }}>
          <label style={styles.label}>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe your daycare environment, philosophy, and what makes you special..."
            style={{ ...styles.input, height: '80px', resize: 'none' }}
          />
        </div>

        {/* Language toggles */}
        <div style={{ marginTop: '14px' }}>
          <label style={styles.label}>Languages offered</label>
          <div style={styles.tags}>
            {LANGUAGES.map(lang => (
              <span
                key={lang}
                onClick={() => toggleLanguage(lang)}
                style={{
                  ...styles.tag,
                  background:  form.language.includes(lang) ? '#EEEDFE' : 'transparent',
                  color:       form.language.includes(lang) ? '#3C3489' : '#6B7280',
                  borderColor: form.language.includes(lang) ? '#AFA9EC' : '#E8E6E0',
                }}
              >
                {lang}
              </span>
            ))}
          </div>
        </div>

        {/* Age group toggles */}
        <div style={{ marginTop: '14px' }}>
          <label style={styles.label}>Age groups accepted</label>
          <div style={styles.tags}>
            {AGE_GROUPS.map(age => (
              <span
                key={age}
                onClick={() => toggleAgeRange(age)}
                style={{
                  ...styles.tag,
                  background:  form.ageRange.includes(age) ? '#E1F5EE' : 'transparent',
                  color:       form.ageRange.includes(age) ? '#085041' : '#6B7280',
                  borderColor: form.ageRange.includes(age) ? '#5DCAA5' : '#E8E6E0',
                }}
              >
                {age}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Availability */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Real-time availability</h2>
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '14px' }}>
          Set how many spots are open per age group. Parents filtering by age will only see daycares with open spots.
        </p>
        <div style={styles.availGrid}>
          {AGE_GROUPS.map(age => {
            const badge = spotLabel(form.availability[age]);
            return (
              <div key={age} style={styles.availItem}>
                <div style={styles.availAge}>{age}</div>
                <div style={styles.availCount}>{form.availability[age]}</div>
                <div style={{ ...styles.availBadge, background: badge.bg, color: badge.color }}>
                  {badge.text}
                </div>
                <div style={styles.availBtns}>
                  <button onClick={() => changeSpots(age, -1)} style={styles.availBtn}>−</button>
                  <button onClick={() => changeSpots(age, +1)} style={styles.availBtn}>+</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coordinates */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Location coordinates</h2>
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>
          Used to show your daycare on the map. Go to maps.google.com, right click your address, and copy the coordinates.
        </p>
        <div style={styles.grid2}>
          <div style={styles.field}>
            <label style={styles.label}>Latitude</label>
            <input
              type="number"
              name="lat"
              value={form.coordinates.lat}
              onChange={handleCoords}
              placeholder="e.g. 44.6488"
              style={styles.input}
              step="0.0001"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Longitude</label>
            <input
              type="number"
              name="lng"
              value={form.coordinates.lng}
              onChange={handleCoords}
              placeholder="e.g. -63.5752"
              style={styles.input}
              step="0.0001"
            />
          </div>
        </div>
      </div>

      {/* Status messages */}
      {status === 'success' && (
        <div style={styles.successMsg}>
          🎉 Daycare listed! Parents can now find you in search results.
        </div>
      )}
      {status === 'error' && (
        <div style={styles.errorMsg}>
          Please fill in all required fields — name, address, city and phone.
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{ ...styles.btnGreen, width: '100%', padding: '14px', fontSize: '15px' }}
      >
        {loading ? 'Saving...' : 'Save and publish listing'}
      </button>
    </div>
  );
}

const styles = {
  page:       { maxWidth: '720px', margin: '0 auto', padding: '32px 16px', background: '#F8F7F4', minHeight: '100vh' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  title:      { fontSize: '24px', fontWeight: '500', color: '#2C2C2A', marginBottom: '4px' },
  subtitle:   { fontSize: '14px', color: '#6B7280' },
  nsBadge:    { fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: '#E1F5EE', color: '#085041' },
  card:       { background: '#fff', border: '1px solid #E8E6E0', borderRadius: '12px', padding: '20px', marginBottom: '16px' },
  cardTitle:  { fontSize: '15px', fontWeight: '500', color: '#2C2C2A', marginBottom: '14px' },
  grid2:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  field:      { display: 'flex', flexDirection: 'column', gap: '4px' },
  label:      { fontSize: '12px', color: '#6B7280' },
  input:      { padding: '8px 10px', borderRadius: '8px', border: '1px solid #E8E6E0', fontSize: '13px', color: '#2C2C2A', background: '#F8F7F4' },
  tags:       { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' },
  tag:        { fontSize: '13px', padding: '5px 12px', borderRadius: '20px', cursor: 'pointer', border: '1px solid' },
  availGrid:  { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  availItem:  { border: '1px solid #E8E6E0', borderRadius: '10px', padding: '14px', textAlign: 'center' },
  availAge:   { fontSize: '12px', color: '#6B7280', marginBottom: '6px', textTransform: 'capitalize' },
  availCount: { fontSize: '28px', fontWeight: '500', color: '#2C2C2A' },
  availBadge: { fontSize: '11px', marginTop: '4px', padding: '2px 8px', borderRadius: '20px', display: 'inline-block' },
  availBtns:  { display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px' },
  availBtn:   { width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #E8E6E0', background: '#fff', fontSize: '16px', cursor: 'pointer' },
  successMsg: { background: '#E1F5EE', color: '#085041', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '12px' },
  errorMsg:   { background: '#FCEBEB', color: '#A32D2D', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '12px' },
  btnGreen:   { padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#1D9E75', color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
};