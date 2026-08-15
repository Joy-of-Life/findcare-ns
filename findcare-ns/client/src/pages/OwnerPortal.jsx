import { useState, useEffect } from 'react';
import { useAuth }    from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL    = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const LANGUAGES  = ['English', 'French', 'Arabic', 'Mandarin', 'Spanish'];
const AGE_GROUPS = ['infant', 'toddler', 'preschool'];

export default function OwnerPortal() {
  const { user, token } = useAuth();
  const navigate        = useNavigate();
  const [myDaycare, setMyDaycare]       = useState(null);
  const [loading, setLoading]           = useState(true);
  const [view, setView]                 = useState('manage');
  const [availability, setAvailability] = useState({ infant: 0, toddler: 0, preschool: 0 });
  const [saveStatus, setSaveStatus]     = useState('');

  const [form, setForm] = useState({
    name: '', address: '', city: '', phone: '',
    monthlyPrice: '', openHours: '', description: '',
    language: [], ageRange: [],
    coordinates: { lat: '', lng: '' },
    availability: { infant: 0, toddler: 0, preschool: 0 },
  });
  const [status, setStatus]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchMyDaycare();
  }, [user]);

  async function fetchMyDaycare() {
    try {
      const res = await fetch(`${API_URL}/api/daycares/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data._id) {
          setMyDaycare(data);
          setAvailability(data.availability || { infant: 0, toddler: 0, preschool: 0 });
          setView('manage');
        } else { setView('register'); }
      } else { setView('register'); }
    } catch (err) { setView('register'); }
    finally { setLoading(false); }
  }

  async function updateAvailability() {
    setSaveStatus('saving');
    try {
      const res = await fetch(`${API_URL}/api/daycares/${myDaycare._id}/availability`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify(availability)
      });
      const data = await res.json();
      setMyDaycare(data);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) { setSaveStatus('error'); }
  }

  function changeSpots(age, delta) {
    setAvailability({ ...availability, [age]: Math.max(0, availability[age] + delta) });
  }

  function spotLabel(count) {
    return count === 0
      ? { text: 'waitlist', bg: '#FFF3E0', color: '#E65100' }
      : { text: 'spots open', bg: '#E8F5E9', color: '#2E7D32' };
  }

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  function handleCoords(e) { setForm({ ...form, coordinates: { ...form.coordinates, [e.target.name]: e.target.value } }); }
  function toggleLanguage(lang) {
    const updated = form.language.includes(lang) ? form.language.filter(l => l !== lang) : [...form.language, lang];
    setForm({ ...form, language: updated });
  }
  function toggleAgeRange(age) {
    const updated = form.ageRange.includes(age) ? form.ageRange.filter(a => a !== age) : [...form.ageRange, age];
    setForm({ ...form, ageRange: updated });
  }
  function changeFormSpots(age, delta) {
    setForm({ ...form, availability: { ...form.availability, [age]: Math.max(0, form.availability[age] + delta) } });
  }

  async function handleSubmit() {
    if (!form.name || !form.address || !form.city || !form.phone) { setStatus('error'); return; }
    setSubmitting(true);
    setStatus('');
    try {
      const res = await fetch(`${API_URL}/api/daycares`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({
          ...form,
          monthlyPrice: Number(form.monthlyPrice),
          coordinates:  { lat: Number(form.coordinates.lat), lng: Number(form.coordinates.lng) }
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setMyDaycare(data);
      setAvailability(data.availability);
      setView('manage');
    } catch (err) { setStatus('error'); }
    finally { setSubmitting(false); }
  }

  if (!user) {
    return (
      <div style={styles.page}>
        <div style={styles.emptyCard}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏫</div>
          <h2 style={styles.emptyTitle}>Owner portal</h2>
          <p style={styles.emptySub}>Log in as a daycare owner to access this page.</p>
          <button onClick={() => navigate('/login')} style={styles.btnOrange}>Log in</button>
        </div>
      </div>
    );
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#FF6B35', fontSize: '18px' }}>🏫 Loading...</div>;

  // ─── MANAGE VIEW ──────────────────────────────────────────────
  if (view === 'manage' && myDaycare) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>🏫 Owner portal</h1>
            <p style={styles.subtitle}>Managing: <strong style={{ color: '#FF6B35' }}>{myDaycare.name}</strong></p>
          </div>
          <span style={styles.nsBadge}>🎈 Nova Scotia</span>
        </div>

        {/* Daycare summary */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Your daycare</h2>
          <div style={styles.infoGrid}>
            {[
              { label: 'Name',    value: myDaycare.name                    },
              { label: 'Address', value: myDaycare.address                 },
              { label: 'City',    value: myDaycare.city                    },
              { label: 'Phone',   value: myDaycare.phone                   },
              { label: 'Price',   value: `$${myDaycare.monthlyPrice}/month` },
              { label: 'Hours',   value: myDaycare.openHours               },
            ].map(info => (
              <div key={info.label} style={styles.infoItem}>
                <div style={styles.infoLabel}>{info.label}</div>
                <div style={styles.infoValue}>{info.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
            {myDaycare.ageRange?.map(age  => <span key={age}  style={styles.tagOrange}>{age}</span>)}
            {myDaycare.language?.map(lang => <span key={lang} style={styles.tagPurple}>{lang}</span>)}
            {myDaycare.verified && <span style={styles.tagGreen}>✓ Verified</span>}
            {myDaycare.licensed && <span style={styles.tagGreen}>✓ Licensed</span>}
          </div>
        </div>

        {/* Availability */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🔔 Update real-time availability</h2>
          <p style={{ fontSize: '13px', color: '#9E9E9E', marginBottom: '14px' }}>
            Parents with alerts will be notified automatically when spots open up.
          </p>
          <div style={styles.availGrid}>
            {AGE_GROUPS.map(age => {
              const badge = spotLabel(availability[age]);
              return (
                <div key={age} style={styles.availItem}>
                  <div style={styles.availAge}>{age}</div>
                  <div style={styles.availCount}>{availability[age]}</div>
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
          {saveStatus === 'saved'  && <div style={styles.successMsg}>✅ Availability updated! Parents notified.</div>}
          {saveStatus === 'error'  && <div style={styles.errorMsg}>Something went wrong. Try again.</div>}
          <button
            onClick={updateAvailability}
            disabled={saveStatus === 'saving'}
            style={{ ...styles.btnOrange, marginTop: '14px', padding: '10px 24px' }}
          >
            {saveStatus === 'saving' ? 'Saving...' : '💾 Update availability'}
          </button>
        </div>

        {/* View profile */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>👀 Your public profile</h2>
          <p style={{ fontSize: '14px', color: '#9E9E9E', marginBottom: '12px' }}>
            See how parents see your daycare listing.
          </p>
          <button onClick={() => navigate(`/daycare/${myDaycare._id}`)} style={styles.btnOrange}>
            View public profile →
          </button>
        </div>
      </div>
    );
  }

  // ─── REGISTER VIEW ────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🏫 List your daycare</h1>
          <p style={styles.subtitle}>Register your daycare on FindCare NS</p>
        </div>
        <span style={styles.nsBadge}>🎈 Nova Scotia</span>
      </div>

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
              <input type={f.type} name={f.name} value={form[f.name]} onChange={handleChange} style={styles.input} />
            </div>
          ))}
        </div>
        <div style={{ ...styles.field, marginTop: '12px' }}>
          <label style={styles.label}>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange}
            placeholder="Describe your daycare..." style={{ ...styles.input, height: '80px', resize: 'none' }} />
        </div>
        <div style={{ marginTop: '14px' }}>
          <label style={styles.label}>Languages offered</label>
          <div style={styles.tags}>
            {LANGUAGES.map(lang => (
              <span key={lang} onClick={() => toggleLanguage(lang)} style={{
                ...styles.tagToggle,
                background:  form.language.includes(lang) ? '#EDE7F6' : 'transparent',
                color:       form.language.includes(lang) ? '#5C35CC' : '#9E9E9E',
                borderColor: form.language.includes(lang) ? '#B39DDB' : '#FFE0B2',
              }}>{lang}</span>
            ))}
          </div>
        </div>
        <div style={{ marginTop: '14px' }}>
          <label style={styles.label}>Age groups accepted</label>
          <div style={styles.tags}>
            {AGE_GROUPS.map(age => (
              <span key={age} onClick={() => toggleAgeRange(age)} style={{
                ...styles.tagToggle,
                background:  form.ageRange.includes(age) ? '#FFF3E0' : 'transparent',
                color:       form.ageRange.includes(age) ? '#E65100' : '#9E9E9E',
                borderColor: form.ageRange.includes(age) ? '#FFCC80' : '#FFE0B2',
              }}>{age}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>🔔 Real-time availability</h2>
        <div style={styles.availGrid}>
          {AGE_GROUPS.map(age => {
            const badge = spotLabel(form.availability[age]);
            return (
              <div key={age} style={styles.availItem}>
                <div style={styles.availAge}>{age}</div>
                <div style={styles.availCount}>{form.availability[age]}</div>
                <div style={{ ...styles.availBadge, background: badge.bg, color: badge.color }}>{badge.text}</div>
                <div style={styles.availBtns}>
                  <button onClick={() => changeFormSpots(age, -1)} style={styles.availBtn}>−</button>
                  <button onClick={() => changeFormSpots(age, +1)} style={styles.availBtn}>+</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📍 Location coordinates</h2>
        <p style={{ fontSize: '13px', color: '#9E9E9E', marginBottom: '12px' }}>
          Go to maps.google.com, right click your address and copy the coordinates.
        </p>
        <div style={styles.grid2}>
          <div style={styles.field}>
            <label style={styles.label}>Latitude</label>
            <input type="number" name="lat" value={form.coordinates.lat} onChange={handleCoords} placeholder="e.g. 44.6488" style={styles.input} step="0.0001" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Longitude</label>
            <input type="number" name="lng" value={form.coordinates.lng} onChange={handleCoords} placeholder="e.g. -63.5752" style={styles.input} step="0.0001" />
          </div>
        </div>
      </div>

      {status === 'success' && <div style={styles.successMsg}>🎉 Daycare listed! Parents can now find you.</div>}
      {status === 'error'   && <div style={styles.errorMsg}>Please fill in all required fields.</div>}

      <button onClick={handleSubmit} disabled={submitting}
        style={{ ...styles.btnOrange, width: '100%', padding: '14px', fontSize: '15px' }}>
        {submitting ? 'Saving...' : '🚀 Save and publish listing'}
      </button>
    </div>
  );
}

const styles = {
  page:       { maxWidth: '720px', margin: '0 auto', padding: '32px 16px', background: '#FFFDF9', minHeight: '100vh' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  title:      { fontSize: '24px', fontWeight: '700', color: '#2C2C2A', marginBottom: '4px' },
  subtitle:   { fontSize: '14px', color: '#9E9E9E' },
  nsBadge:    { fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: '#FFF3E0', color: '#E65100', border: '1px solid #FFCC80' },
  card:       { background: '#fff', border: '1.5px solid #FFE0B2', borderRadius: '16px', padding: '20px', marginBottom: '16px' },
  cardTitle:  { fontSize: '15px', fontWeight: '600', color: '#2C2C2A', marginBottom: '14px' },
  infoGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  infoItem:   { padding: '8px 0', borderBottom: '1px solid #FFE0B2' },
  infoLabel:  { fontSize: '11px', color: '#9E9E9E', marginBottom: '2px' },
  infoValue:  { fontSize: '14px', color: '#2C2C2A', fontWeight: '500' },
  grid2:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  field:      { display: 'flex', flexDirection: 'column', gap: '4px' },
  label:      { fontSize: '12px', color: '#9E9E9E', fontWeight: '500' },
  input:      { padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #FFCC80', fontSize: '13px', color: '#2C2C2A', background: '#FFFDF9', outline: 'none' },
  tags:       { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' },
  tagToggle:  { fontSize: '13px', padding: '5px 12px', borderRadius: '20px', cursor: 'pointer', border: '1.5px solid' },
  tagOrange:  { fontSize: '12px', background: '#FFF3E0', color: '#E65100', padding: '3px 10px', borderRadius: '20px', border: '1px solid #FFCC80' },
  tagPurple:  { fontSize: '12px', background: '#EDE7F6', color: '#5C35CC', padding: '3px 10px', borderRadius: '20px', border: '1px solid #B39DDB' },
  tagGreen:   { fontSize: '12px', background: '#E8F5E9', color: '#2E7D32', padding: '3px 10px', borderRadius: '20px', border: '1px solid #A5D6A7' },
  availGrid:  { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  availItem:  { border: '1.5px solid #FFE0B2', borderRadius: '10px', padding: '14px', textAlign: 'center', background: '#FFFDF9' },
  availAge:   { fontSize: '12px', color: '#9E9E9E', marginBottom: '6px', textTransform: 'capitalize' },
  availCount: { fontSize: '28px', fontWeight: '700', color: '#FF6B35' },
  availBadge: { fontSize: '11px', marginTop: '4px', padding: '2px 8px', borderRadius: '20px', display: 'inline-block' },
  availBtns:  { display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px' },
  availBtn:   { width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid #FFCC80', background: '#fff', fontSize: '16px', cursor: 'pointer', color: '#FF6B35', fontWeight: '700' },
  successMsg: { background: '#E8F5E9', color: '#2E7D32', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '12px', border: '1px solid #A5D6A7' },
  errorMsg:   { background: '#FFEBEE', color: '#C62828', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '12px', border: '1px solid #EF9A9A' },
  btnOrange:  { padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#FF6B35', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  emptyCard:  { background: '#fff', borderRadius: '20px', border: '2px solid #FFE0B2', padding: '40px', textAlign: 'center', maxWidth: '440px', margin: '40px auto' },
  emptyTitle: { fontSize: '20px', fontWeight: '700', color: '#2C2C2A', marginBottom: '8px' },
  emptySub:   { fontSize: '14px', color: '#9E9E9E', marginBottom: '16px' },
};