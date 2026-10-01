import { useState, useEffect } from 'react';
import { useAuth }    from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AGE_GROUP_LABELS, AGE_GROUP_OPTIONS, AVAILABILITY_AGE_GROUPS } from '../constants/ageGroups';
import './OwnerPortal.css';

const API_URL    = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const LANGUAGES  = ['English', 'French', 'Arabic', 'Mandarin', 'Spanish'];
const PROVIDER_FEATURES = [
  { name: 'acceptsSubsidy', label: 'Accepts subsidy' },
  { name: 'mealsProvided', label: 'Meals provided' },
  { name: 'outdoorPlaySpace', label: 'Outdoor play space' },
];
const DAYS_OPEN = [
  { value: 'mon', label: 'Mon' }, { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' }, { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' }, { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
];
const DEFAULT_AVAILABILITY = { infant: 0, toddler: 0, preschool: 0 };

function toTimeInput(value = '') {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) return '';
  let hours = Number(match[1]) % 12;
  if (match[3].toLowerCase() === 'pm') hours += 12;
  return `${String(hours).padStart(2, '0')}:${match[2]}`;
}

function formatTime(value = '') {
  if (!value) return '';
  const [hours, minutes] = value.split(':').map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
}

function parseOpenHours(openHours = '') {
  const match = openHours.match(/(\d{1,2}:\d{2}\s*(?:am|pm))\s+(?:–|-|to)\s+(\d{1,2}:\d{2}\s*(?:am|pm))/i);
  return match ? { opensAt: toTimeInput(match[1]), closesAt: toTimeInput(match[2]) } : { opensAt: '', closesAt: '' };
}

function formatOpenHours(daysOpen, opensAt, closesAt) {
  const days = DAYS_OPEN.filter(day => daysOpen.includes(day.value)).map(day => day.label);
  if (!days.length || !opensAt || !closesAt) return '';
  const daysLabel = days.join(',') === 'Mon,Tue,Wed,Thu,Fri'
    ? 'Mon–Fri'
    : days.length === DAYS_OPEN.length ? 'Mon–Sun' : days.join(', ');
  return `${daysLabel}, ${formatTime(opensAt)} – ${formatTime(closesAt)}`;
}

function createDaycareForm(daycare = {}) {
  const parsedHours = parseOpenHours(daycare.openHours);
  return {
    name: daycare.name || '',
    address: daycare.address || '',
    hideAddress: Boolean(daycare.hideAddress),
    city: daycare.city || '',
    phone: daycare.phone || '',
    monthlyPrice: daycare.monthlyPrice ?? '',
    openHours: daycare.openHours || '',
    opensAt: daycare.opensAt || parsedHours.opensAt,
    closesAt: daycare.closesAt || parsedHours.closesAt,
    maxChildren: daycare.maxChildren ?? daycare.maxChildrenAtATime ?? '',
    daysOpen: daycare.daysOpen?.length ? daycare.daysOpen : ['mon', 'tue', 'wed', 'thu', 'fri'],
    description: daycare.description || '',
    language: daycare.language || [],
    ageRange: daycare.ageRange || [],
    acceptsSubsidy: Boolean(daycare.acceptsSubsidy),
    mealsProvided: Boolean(daycare.mealsProvided),
    outdoorPlaySpace: Boolean(daycare.outdoorPlaySpace),
    coordinates: {
      lat: daycare.coordinates?.lat ?? '',
      lng: daycare.coordinates?.lng ?? '',
    },
    availability: { ...DEFAULT_AVAILABILITY, ...daycare.availability },
  };
}

export default function OwnerPortal() {
  const { user, token } = useAuth();
  const navigate        = useNavigate();
  const [myDaycare, setMyDaycare]       = useState(null);
  const [loading, setLoading]           = useState(true);
  const [view, setView]                 = useState('manage');
  const [availability, setAvailability] = useState({ infant: 0, toddler: 0, preschool: 0 });
  const [saveStatus, setSaveStatus]     = useState('');

  const [form, setForm] = useState(createDaycareForm);
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
          setForm(createDaycareForm(data));
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

  function handleChange(e) {
    const { name } = e.target;
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (name === 'opensAt' || name === 'closesAt') {
      setForm(current => {
        const next = { ...current, [name]: value };
        return {
          ...next,
          openHours: formatOpenHours(next.daysOpen, next.opensAt, next.closesAt),
        };
      });
      return;
    }
    setForm({ ...form, [name]: value });
  }
  function toggleOpenDay(day) {
    setForm(current => {
      const daysOpen = current.daysOpen.includes(day)
        ? current.daysOpen.filter(value => value !== day)
        : [...current.daysOpen, day];
      return { ...current, daysOpen, openHours: formatOpenHours(daysOpen, current.opensAt, current.closesAt) };
    });
  }
  function setOpenDays(daysOpen) {
    setForm(current => ({
      ...current,
      daysOpen,
      openHours: formatOpenHours(daysOpen, current.opensAt, current.closesAt),
    }));
  }
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
    const latitude = Number(form.coordinates.lat);
    const longitude = Number(form.coordinates.lng);
    const hasValidCoordinates = form.coordinates.lat !== '' && form.coordinates.lng !== '' &&
      latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
    const isValid = form.name.trim() && form.address.trim() && form.city.trim() && form.phone.trim() &&
      form.description.trim() && form.monthlyPrice !== '' && Number.isFinite(Number(form.monthlyPrice)) && Number(form.monthlyPrice) >= 0 && form.language.length > 0 &&
      form.ageRange.length > 0 && Number.isInteger(Number(form.maxChildren)) && Number(form.maxChildren) > 0 &&
      form.daysOpen.length > 0 && form.opensAt && form.closesAt && form.opensAt < form.closesAt &&
      hasValidCoordinates;
    if (!isValid) { setStatus('error'); return; }
    const isEditing = view === 'edit' && myDaycare;
    setSubmitting(true);
    setStatus('');
    try {
      const res = await fetch(isEditing ? `${API_URL}/api/daycares/${myDaycare._id}` : `${API_URL}/api/daycares`, {
        method:  isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({
          ...form,
          openHours: formatOpenHours(form.daysOpen, form.opensAt, form.closesAt),
          maxChildren: Number(form.maxChildren),
          monthlyPrice: Number(form.monthlyPrice),
          coordinates:  { lat: latitude, lng: longitude }
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save daycare details');
      const savedDaycare = {
        ...data,
        maxChildren: data.maxChildren ?? data.maxChildrenAtATime ?? Number(form.maxChildren),
      };
      setMyDaycare(savedDaycare);
      setAvailability(data.availability || DEFAULT_AVAILABILITY);
      setForm(createDaycareForm(savedDaycare));
      setStatus('success');
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

  const isEditing = view === 'edit' && Boolean(myDaycare);

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
        {status === 'success' && <div style={styles.successMsg}>Daycare listing saved successfully.</div>}

        {/* Daycare summary */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Your daycare</h2>
            <button onClick={() => { setStatus(''); setView('edit'); }} style={styles.btnOutline}>
              Edit listing
            </button>
          </div>
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
            {myDaycare.ageRange?.map(age  => <span key={age}  style={styles.tagOrange}>{AGE_GROUP_LABELS[age] || age}</span>)}
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
            {AVAILABILITY_AGE_GROUPS.map(age => {
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
          <h1 style={styles.title}>{isEditing ? 'Edit daycare listing' : '🏫 List your daycare'}</h1>
          <p style={styles.subtitle}>{isEditing ? `Update details for ${myDaycare.name}` : 'Register your daycare on FindCare NS'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isEditing && <button onClick={() => { setStatus(''); setView('manage'); }} style={styles.btnOutline}>Cancel</button>}
          <span style={styles.nsBadge}>🎈 Nova Scotia</span>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Basic information</h2>
        <div style={styles.grid2}>
          {[
            { label: 'Daycare name *',      name: 'name',         type: 'text'   },
            { label: 'Phone *',             name: 'phone',        type: 'tel'    },
            { label: 'Address *',           name: 'address',      type: 'text'   },
            { label: 'City *',              name: 'city',         type: 'text'   },
            { label: 'Monthly price ($) *', name: 'monthlyPrice', type: 'number' },
          ].map(f => (
            <div key={f.name} style={styles.field}>
              <label style={styles.label}>{f.label}</label>
              <input
                id={f.name}
                type={f.type}
                name={f.name}
                value={form[f.name]}
                onChange={handleChange}
                style={styles.input}
                required
                min={f.name === 'monthlyPrice' ? '0' : undefined}
                step={f.name === 'monthlyPrice' ? '1' : undefined}
              />
            </div>
          ))}
        </div>
        <label style={styles.addressPrivacy}>
          <input
            type="checkbox"
            name="hideAddress"
            checked={form.hideAddress}
            onChange={handleChange}
          />
          <span>
            <strong>Hide my exact street address</strong>
            <span style={styles.addressPrivacyNote}>
              Recommended for home-based providers. Parents see your city and an approximate map location instead.
            </span>
          </span>
        </label>
        <div style={{ ...styles.field, marginTop: '12px' }}>
          <label style={styles.label}>Description *</label>
          <textarea name="description" value={form.description} onChange={handleChange}
            placeholder="Describe your daycare..." style={{ ...styles.input, height: '80px', resize: 'none' }} required />
        </div>
        <div style={{ marginTop: '14px' }}>
          <label style={styles.label}>Languages offered *</label>
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
        <div className="owner-provider-features">
          {PROVIDER_FEATURES.map(feature => (
            <label key={feature.name} className="owner-provider-feature">
              <input
                type="checkbox"
                name={feature.name}
                checked={form[feature.name]}
                onChange={handleChange}
              />
              <span>{feature.label}</span>
            </label>
          ))}
        </div>
        <div style={{ marginTop: '14px' }}>
          <div className="owner-service-grid">
            <div>
              <label style={styles.label}>Ages served *</label>
              <div className="owner-age-options">
                {AGE_GROUP_OPTIONS.map(({ value, label, range }) => (
                  <label key={value} className="owner-age-option" style={{
                    borderColor: form.ageRange.includes(value) ? '#FFCC80' : '#E8E1D5',
                    background: form.ageRange.includes(value) ? '#FFF8EE' : '#fff',
                  }}>
                    <input type="checkbox" checked={form.ageRange.includes(value)} onChange={() => toggleAgeRange(value)} />
                    <span>{label} ({range})</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="owner-max-children">
              <label style={styles.label} htmlFor="maxChildren">Max children at a time *</label>
              <input
                id="maxChildren"
                type="number"
                name="maxChildren"
                min="1"
                step="1"
                value={form.maxChildren}
                onChange={handleChange}
                style={styles.input}
                required
              />
              <p className="owner-capacity-note">
                In Nova Scotia, an unlicensed home child care provider may care for up to 6 children under age 13, including their own children.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Days and hours open *</h2>
        <div className="owner-days-row">
          {DAYS_OPEN.map(day => (
            <button
              key={day.value}
              type="button"
              aria-pressed={form.daysOpen.includes(day.value)}
              onClick={() => toggleOpenDay(day.value)}
            >
              {day.label}
            </button>
          ))}
        </div>
        <div className="owner-day-presets">
          <button type="button" onClick={() => setOpenDays(['mon', 'tue', 'wed', 'thu', 'fri'])}>Weekdays</button>
          <span>|</span>
          <button type="button" onClick={() => setOpenDays(DAYS_OPEN.map(day => day.value))}>All week</button>
          <span>|</span>
          <button type="button" onClick={() => setOpenDays([])}>Clear</button>
        </div>
        <div className="owner-time-fields">
          <div style={styles.field}>
            <label style={styles.label} htmlFor="opensAt">Opens at *</label>
            <input id="opensAt" type="time" name="opensAt" value={form.opensAt} onChange={handleChange} style={styles.input} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="closesAt">Closes at *</label>
            <input id="closesAt" type="time" name="closesAt" value={form.closesAt} onChange={handleChange} style={styles.input} required />
          </div>
        </div>
        {form.openHours && <p className="owner-hours-preview">Preview: {formatOpenHours(form.daysOpen, form.opensAt, form.closesAt)}</p>}
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>🔔 Real-time availability</h2>
        <div style={styles.availGrid}>
          {AVAILABILITY_AGE_GROUPS.map(age => {
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
            <input type="number" name="lat" value={form.coordinates.lat} onChange={handleCoords} placeholder="e.g. 44.6488" style={styles.input} step="0.0001" min="-90" max="90" required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Longitude</label>
            <input type="number" name="lng" value={form.coordinates.lng} onChange={handleCoords} placeholder="e.g. -63.5752" style={styles.input} step="0.0001" min="-180" max="180" required />
          </div>
        </div>
      </div>

      {status === 'error'   && <div style={styles.errorMsg}>Complete all required fields. Select at least one language, age group, and open day; add valid coordinates and a closing time after opening.</div>}

      <button onClick={handleSubmit} disabled={submitting}
        style={{ ...styles.btnOrange, width: '100%', padding: '14px', fontSize: '15px' }}>
        {submitting ? 'Saving...' : isEditing ? 'Save changes' : '🚀 Save and publish listing'}
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
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' },
  cardTitle:  { fontSize: '15px', fontWeight: '600', color: '#2C2C2A', marginBottom: '14px' },
  infoGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  infoItem:   { padding: '8px 0', borderBottom: '1px solid #FFE0B2' },
  infoLabel:  { fontSize: '11px', color: '#9E9E9E', marginBottom: '2px' },
  infoValue:  { fontSize: '14px', color: '#2C2C2A', fontWeight: '500' },
  grid2:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  hoursFields:{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  field:      { display: 'flex', flexDirection: 'column', gap: '4px' },
  addressPrivacy: { display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '14px', padding: '14px 16px', border: '1px solid #E8E1D5', borderRadius: '10px', background: '#FFFDF7', color: '#2C2C2A', fontSize: '14px', cursor: 'pointer' },
  addressPrivacyNote: { display: 'block', marginTop: '4px', color: '#777', fontSize: '12px', lineHeight: 1.5 },
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
  btnOutline: { padding: '7px 13px', borderRadius: '8px', border: '1px solid #D8CCBC', background: '#fff', color: '#454945', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  emptyCard:  { background: '#fff', borderRadius: '20px', border: '2px solid #FFE0B2', padding: '40px', textAlign: 'center', maxWidth: '440px', margin: '40px auto' },
  emptyTitle: { fontSize: '20px', fontWeight: '700', color: '#2C2C2A', marginBottom: '8px' },
  emptySub:   { fontSize: '14px', color: '#9E9E9E', marginBottom: '16px' },
};