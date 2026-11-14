import { useState, useEffect, useCallback } from 'react';
import { useAuth }    from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { AGE_GROUP_LABELS, AGE_GROUP_OPTIONS, AVAILABILITY_AGE_GROUPS } from '../constants/ageGroups';
import LicensingBadge from '../components/LicensingBadge';
import { formatDailyRate } from '../utils/pricing';
import './OwnerPortal.css';

const API_URL    = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const LANGUAGES  = ['English', 'French', 'Arabic', 'Mandarin', 'Spanish'];
const PROVIDER_TYPES = [
  { value: 'licensedCentre', label: 'Licensed child care centre' },
  { value: 'regulatedFamilyHome', label: 'Regulated family home child care provider' },
  { value: 'unlicensedHome', label: 'Unlicensed home child care provider' },
];
const PROVIDER_TYPE_CONFIRMATIONS = {
  licensedCentre: 'I confirm that I am listing as a licensed child care centre, that my centre currently holds a valid provincial child care licence, and that I will update this listing if my licensing status changes.',
  regulatedFamilyHome: 'I confirm that I operate this home daycare as a regulated family home child care provider under a licensed family home day care agency, that I will not exceed the maximum number of children permitted for my approval, and that I will update this listing if my approval status changes.',
  unlicensedHome: 'I confirm that I am listing as an unlicensed home child care provider, that my home is not provincially licensed or regulated, and that I will not describe it as licensed or regulated. I will stay within the limits for unlicensed home care.',
};
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
const DEFAULT_AVAILABILITY = Object.fromEntries(AGE_GROUP_OPTIONS.map(({ value }) => [value, 0]));

function getCapacityDetails(providerType) {
  if (providerType === 'licensedCentre') {
    return {
      label: 'License-approved capacity *',
      help: 'Enter the total capacity on your current facility licence. Include any program- or age-specific limits in the description.',
      confirmation: 'I confirm this capacity matches my current child care facility licence.',
    };
  }
  if (providerType === 'regulatedFamilyHome') {
    return {
      label: 'Maximum approved home capacity *',
      help: 'Regulated family homes may care for up to 7 children at a time, including the provider’s own children. Age-mix limits also apply.',
      confirmation: 'I confirm this capacity follows my licensed family home agency’s approval and provincial age-mix rules, including my own children.',
    };
  }
  if (providerType === 'unlicensedHome') {
    return {
      label: 'Maximum home care capacity *',
      help: 'Unlicensed care is limited to 6 children at a time, including the provider’s own children.',
      confirmation: 'I confirm this capacity follows the unlicensed care limit of up to 6 children, including my own children.',
    };
  }
  return {
    label: 'Maximum children at a time *',
    help: 'Select a provider type to see the applicable capacity guidance.',
    confirmation: '',
  };
}

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

function formatWaitlistDate(value) {
  if (!value) return '—';
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return '—';
  return new Date(year, month - 1, day).toLocaleDateString();
}

function formatWaitlistEnrollment(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function createDaycareForm(daycare = {}) {
  const parsedHours = parseOpenHours(daycare.openHours);
  return {
    name: daycare.name || '',
    address: daycare.address || '',
    hideAddress: Boolean(daycare.hideAddress),
    facebookPageLink: daycare.facebookPageLink || '',
    city: daycare.city || '',
    phone: daycare.phone || '',
    dailyRate: daycare.dailyRate ?? '',
    dailyRateAttestationConfirmed: Boolean(daycare._id),
    providerType: daycare.providerType || '',
    providerStatusAttestationConfirmed: Boolean(daycare._id),
    capacityAttestationConfirmed: Boolean(daycare._id),
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
  const [cityOptions, setCityOptions]   = useState([]);
  const [cityOptionsError, setCityOptionsError] = useState('');
  const [loading, setLoading]           = useState(true);
  const [view, setView]                 = useState('manage');
  const [availability, setAvailability] = useState({ infant: 0, toddler: 0, preschool: 0 });
  const [saveStatus, setSaveStatus]     = useState('');
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [waitlistFilter, setWaitlistFilter] = useState('all');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');
  const [waitlistUpdatedAt, setWaitlistUpdatedAt] = useState(null);

  const [form, setForm] = useState(createDaycareForm);
  const [status, setStatus]       = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAttestation, setShowAttestation] = useState(false);
  const [attestation, setAttestation] = useState({
    providerType: '',
    providerTypeConfirmed: false,
    termsAccepted: false,
    marketingOptIn: false,
  });

  useEffect(() => {
    if (user) fetchMyDaycare();
  }, [user]);

  const fetchWaitlist = useCallback(async () => {
    if (!myDaycare?._id || !token) return;
    setWaitlistLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/waitlist/${myDaycare._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to load the waitlist');
      if (!Array.isArray(data)) throw new Error('Unexpected waitlist response');
      setWaitlistEntries(data);
      setWaitlistError('');
      setWaitlistUpdatedAt(new Date());
    } catch (err) {
      setWaitlistError(err.message || 'Unable to load the waitlist');
    } finally {
      setWaitlistLoading(false);
    }
  }, [myDaycare?._id, token]);

  useEffect(() => {
    if (view !== 'manage' || !myDaycare?._id) return undefined;
    fetchWaitlist();
    const intervalId = setInterval(fetchWaitlist, 30000);
    return () => clearInterval(intervalId);
  }, [fetchWaitlist, myDaycare?._id, view]);

  async function fetchCityOptions() {
    try {
      const res = await fetch(`${API_URL}/api/daycares/cities`);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        throw new Error(data.error || 'Unable to load Nova Scotia communities');
      }
      setCityOptions(data);
      setCityOptionsError('');
    } catch (err) {
      setCityOptionsError(err.message || 'Unable to load Nova Scotia communities');
    }
  }

  async function fetchMyDaycare() {
    fetchCityOptions();
    try {
      const res = await fetch(`${API_URL}/api/daycares/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data._id) {
          setMyDaycare(data);
          setAvailability({ ...DEFAULT_AVAILABILITY, ...data.availability });
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
      if (!res.ok) throw new Error(data.error || 'Unable to update availability');
      setMyDaycare(data);
      setAvailability({ ...DEFAULT_AVAILABILITY, ...data.availability });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) { setSaveStatus(err.message || 'error'); }
  }

  function changeSpots(age, delta) {
    setAvailability(current => {
      const maxChildren = Number(myDaycare.maxChildren ?? myDaycare.maxChildrenAtATime ?? 0);
      const total = AVAILABILITY_AGE_GROUPS.reduce((sum, group) => sum + Number(current[group] || 0), 0);
      if (!myDaycare.ageRange?.includes(age) || (delta > 0 && total >= maxChildren)) return current;
      return { ...current, [age]: Math.max(0, Number(current[age] || 0) + delta) };
    });
  }

  function spotLabel(count) {
    return count === 0
      ? { text: 'waitlist', bg: '#FFF3E0', color: '#E65100' }
      : { text: 'spots open', bg: '#E8F5E9', color: '#2E7D32' };
  }

  function handleChange(e) {
    const { name } = e.target;
    if (name === 'providerType') {
      setForm(current => ({
        ...current,
        providerType: e.target.value,
        providerStatusAttestationConfirmed: false,
        capacityAttestationConfirmed: false,
      }));
      setAttestation(current => ({ ...current, providerType: '', providerTypeConfirmed: false }));
      return;
    }
    if (name === 'maxChildren') {
      setForm(current => ({
        ...current,
        maxChildren: e.target.value,
        capacityAttestationConfirmed: false,
      }));
      return;
    }
    if (name === 'dailyRate') {
      setForm(current => ({
        ...current,
        dailyRate: e.target.value,
        dailyRateAttestationConfirmed: false,
      }));
      return;
    }
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
    setForm(current => {
      const ageRange = current.ageRange.includes(age)
        ? current.ageRange.filter(value => value !== age)
        : [...current.ageRange, age];
      return {
        ...current,
        capacityAttestationConfirmed: false,
        ageRange,
        availability: ageRange.includes(age)
          ? current.availability
          : { ...current.availability, [age]: 0 },
      };
    });
  }
  function changeFormSpots(age, delta) {
    setForm(current => {
      const total = AVAILABILITY_AGE_GROUPS.reduce((sum, group) => sum + Number(current.availability[group] || 0), 0);
      const maxChildren = Number(current.maxChildren || 0);
      if (!current.ageRange.includes(age) || (delta > 0 && total >= maxChildren)) return current;
      return {
        ...current,
        availability: {
          ...current.availability,
          [age]: Math.max(0, Number(current.availability[age] || 0) + delta),
        },
      };
    });
  }

  async function handleSubmit() {
    const isEditing = view === 'edit' && Boolean(myDaycare);
    const totalAvailableSpots = AVAILABILITY_AGE_GROUPS.reduce(
      (total, age) => total + Number(form.availability[age] || 0), 0
    );
    const availabilityCountsAreValid = AVAILABILITY_AGE_GROUPS.every(age => {
      const count = Number(form.availability[age] || 0);
      return Number.isInteger(count) && count >= 0 && (count === 0 || form.ageRange.includes(age));
    });
    const latitude = Number(form.coordinates.lat);
    const longitude = Number(form.coordinates.lng);
    const hasCoordinates = form.coordinates.lat !== '' || form.coordinates.lng !== '';
    const hasValidCoordinates = !hasCoordinates || (form.coordinates.lat !== '' && form.coordinates.lng !== '' &&
      latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180);
    const validationErrors = [];
    if (!form.name.trim()) validationErrors.push('Daycare name');
    if (!form.address.trim()) validationErrors.push('Address');
    if (!cityOptions.includes(form.city)) validationErrors.push('A city or community in Nova Scotia');
    if (!form.phone.trim()) validationErrors.push('Phone');
    else if (!/^\d{10}$/.test(form.phone)) {
      validationErrors.push('Phone number must contain exactly 10 digits with no spaces or punctuation');
    }
    if (form.dailyRate === '' || !Number.isFinite(Number(form.dailyRate)) || Number(form.dailyRate) < 0) {
      validationErrors.push('Daily rate');
    }
    if (!form.dailyRateAttestationConfirmed) validationErrors.push('Daily rate confirmation');
    if (!form.description.trim()) validationErrors.push('Description');
    if (!form.language.length) validationErrors.push('Languages offered');
    if (!PROVIDER_TYPES.some(providerType => providerType.value === form.providerType)) {
      validationErrors.push('Provider type');
    }
    if (isEditing && form.providerType && !form.providerStatusAttestationConfirmed) {
      validationErrors.push('Provider status confirmation');
    }
    if (!form.ageRange.length) validationErrors.push('Ages served');
    if (!Number.isInteger(Number(form.maxChildren)) || Number(form.maxChildren) < 1) {
      validationErrors.push('Max children at a time');
    }
    if (!form.capacityAttestationConfirmed) validationErrors.push('Provider capacity confirmation');
    if (!availabilityCountsAreValid) validationErrors.push('Availability counts must be whole numbers for selected ages');
    if (Number.isInteger(Number(form.maxChildren)) && totalAvailableSpots > Number(form.maxChildren)) {
      validationErrors.push('Total open spots cannot exceed max children');
    }
    if (!form.daysOpen.length) validationErrors.push('Days open');
    if (!form.opensAt) validationErrors.push('Opening time');
    if (!form.closesAt) validationErrors.push('Closing time');
    if (form.opensAt && form.closesAt && form.opensAt >= form.closesAt) {
      validationErrors.push('Closing time must be later than opening time');
    }
    if (!hasValidCoordinates) validationErrors.push('Valid latitude and longitude');

    if (validationErrors.length) {
      setStatus('error');
      setSubmitError(`Please fix: ${validationErrors.join('; ')}.`);
      return;
    }
    if (!isEditing && !showAttestation) {
      setStatus('');
      setSubmitError('');
      setShowAttestation(true);
      return;
    }
    if (!isEditing && (
      !attestation.providerTypeConfirmed
      || attestation.providerType !== form.providerType
      || !attestation.termsAccepted
    )) {
      setStatus('attestation-error');
      setSubmitError('');
      return;
    }
    setSubmitting(true);
    setStatus('');
    setSubmitError('');
    try {
      const res = await fetch(isEditing ? `${API_URL}/api/daycares/${myDaycare._id}` : `${API_URL}/api/daycares`, {
        method:  isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({
          ...form,
          openHours: formatOpenHours(form.daysOpen, form.opensAt, form.closesAt),
          maxChildren: Number(form.maxChildren),
          capacityAttestationConfirmed: form.capacityAttestationConfirmed,
          providerStatusAttestationConfirmed: isEditing
            ? form.providerStatusAttestationConfirmed
            : attestation.providerTypeConfirmed,
          dailyRate: Number(form.dailyRate),
          coordinates: hasCoordinates ? { lat: latitude, lng: longitude } : undefined,
          complianceAttestation: isEditing ? undefined : attestation,
        }),
      });
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
      setSubmitError('');
      setShowAttestation(false);
      setView('manage');
    } catch (err) {
      setStatus('error');
      setSubmitError(err.message || 'Unable to save daycare details. Please try again.');
    }
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

  if (showAttestation && !isEditing) {
    return (
      <div className="owner-attestation" aria-labelledby="owner-attestation-title">
        <h1 id="owner-attestation-title" className="owner-attestation__title">Compliance attestation</h1>
        <p className="owner-attestation__intro">
          Please confirm the statements below to publish your listing. They help families see accurate information.
        </p>

        <section className="owner-attestation__guidance" aria-labelledby="owner-attestation-rules">
          {form.providerType !== 'unlicensedHome' && (
            <h2 id="owner-attestation-rules">{PROVIDER_TYPES.find(type => type.value === form.providerType)?.label} — Nova Scotia</h2>
          )}
          {form.providerType === 'licensedCentre' && (
            <p>Your current facility licence determines the approved capacity. Any program- or age-specific limits also apply.</p>
          )}
          {form.providerType === 'regulatedFamilyHome' && (
            <p>Regulated family home care is limited to 7 children at a time, including the provider’s own children. Age-mix limits also apply.</p>
          )}
          {form.providerType === 'unlicensedHome' && (
            <p>I confirm that I am listing as an unlicensed home child care provider, that my home is not provincially licensed or regulated, and that I will not describe it as licensed or regulated. I will stay within the limits for unlicensed home care.</p>
          )}
          <a href={form.providerType === 'licensedCentre'
            ? 'https://childcarenovascotia.ca/operators/current-operators/licensing'
            : 'https://novascotia.ca/just/regulations/regs/elcc.htm'}
          target="_blank" rel="noreferrer">
            Read the official Nova Scotia guidance →
          </a>
        </section>

        <div className="owner-attestation__checks">
          <label className="owner-attestation__check">
            <input
              type="checkbox"
              required
              checked={attestation.providerTypeConfirmed && attestation.providerType === form.providerType}
              onChange={event => setAttestation(current => ({
                ...current,
                providerType: event.target.checked ? form.providerType : '',
                providerTypeConfirmed: event.target.checked,
              }))}
            />
            <span>{PROVIDER_TYPE_CONFIRMATIONS[form.providerType]}</span>
          </label>
          <label className="owner-attestation__check">
            <input type="checkbox" required checked={attestation.termsAccepted} onChange={event => setAttestation(current => ({ ...current, termsAccepted: event.target.checked }))} />
            <span>I agree to FindCare NS's <Link className="owner-attestation__policy-link" to="/about" target="_blank" rel="noreferrer">Terms of Service</Link> and <Link className="owner-attestation__policy-link" to="/about" target="_blank" rel="noreferrer">Privacy Policy</Link>.</span>
          </label>
          <label className="owner-attestation__check">
            <input type="checkbox" checked={attestation.marketingOptIn} onChange={event => setAttestation(current => ({ ...current, marketingOptIn: event.target.checked }))} />
            <span>(Optional) I agree to receive occasional marketing emails about FindCare NS features and tips. I can unsubscribe at any time.</span>
          </label>
        </div>

        {(status === 'attestation-error' || status === 'error') && (
          <p className="owner-attestation__error" role="alert">
            {status === 'attestation-error'
              ? 'Confirm each required statement before submitting.'
              : submitError || 'Unable to submit your listing. Please try again.'}
          </p>
        )}
        <div className="owner-attestation__actions">
          <button type="button" className="owner-attestation__back" onClick={() => { setStatus(''); setShowAttestation(false); }}>
            <span aria-hidden="true">←</span> Back
          </button>
          <button type="button" className="owner-attestation__submit" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit & publish listing'} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── MANAGE VIEW ──────────────────────────────────────────────
  if (view === 'manage' && myDaycare) {
    const filteredWaitlistEntries = waitlistFilter === 'all'
      ? waitlistEntries
      : waitlistEntries.filter(entry => entry.ageGroup === waitlistFilter);

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
              { label: 'Daily rate', value: formatDailyRate(myDaycare.dailyRate) },
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
            <LicensingBadge licensed={myDaycare.licensed} providerType={myDaycare.providerType} />
          </div>
        </div>

        {/* Availability */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🔔 Update real-time availability</h2>
          <p style={{ fontSize: '13px', color: '#9E9E9E', marginBottom: '14px' }}>
            Parents with alerts will be notified automatically when spots open up.
          </p>
          <div style={styles.availGrid}>
            {myDaycare.ageRange?.filter(age => AVAILABILITY_AGE_GROUPS.includes(age)).map(age => {
              const badge = spotLabel(availability[age]);
              return (
                <div key={age} style={styles.availItem}>
                  <div style={styles.availAge}>{age}</div>
                  <div style={styles.availCount}>{availability[age]}</div>
                  <div style={{ ...styles.availBadge, background: badge.bg, color: badge.color }}>
                    {badge.text}
                  </div>
                  <div style={styles.availBtns}>
                    <button disabled={!availability[age]} onClick={() => changeSpots(age, -1)} style={styles.availBtn}>−</button>
                    <button
                      disabled={AVAILABILITY_AGE_GROUPS.reduce((sum, group) => sum + Number(availability[group] || 0), 0) >= Number(myDaycare.maxChildren ?? myDaycare.maxChildrenAtATime ?? 0)}
                      onClick={() => changeSpots(age, +1)}
                      style={styles.availBtn}
                    >+</button>
                  </div>
                </div>
              );
            })}
          </div>
          {saveStatus === 'saved'  && <div style={styles.successMsg}>✅ Availability updated! Parents notified.</div>}
          {saveStatus && !['saving', 'saved'].includes(saveStatus) && <div style={styles.errorMsg}>{saveStatus}</div>}
          <button
            onClick={updateAvailability}
            disabled={saveStatus === 'saving'}
            style={{ ...styles.btnOrange, marginTop: '14px', padding: '10px 24px' }}
          >
            {saveStatus === 'saving' ? 'Saving...' : '💾 Update availability'}
          </button>
        </div>

        {/* Waitlist queue */}
        <div style={styles.card}>
          <div className="owner-waitlist-header">
            <h2 style={styles.cardTitle}>📋 Real-time waitlist queue</h2>
            <button
              type="button"
              onClick={fetchWaitlist}
              disabled={waitlistLoading}
              style={styles.btnOutline}
            >
              {waitlistLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <p style={{ fontSize: '13px', color: '#68788A', margin: '0 0 14px' }}>
            Families are listed in the order they joined. The queue refreshes automatically every 30 seconds.
          </p>
          <div className="owner-waitlist-controls">
            <label htmlFor="owner-waitlist-filter" style={styles.label}>Filter by age group</label>
            <select
              id="owner-waitlist-filter"
              value={waitlistFilter}
              onChange={event => setWaitlistFilter(event.target.value)}
              style={styles.input}
            >
              <option value="all">All categories</option>
              {AGE_GROUP_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <span className="owner-waitlist-count">{waitlistEntries.length} active {waitlistEntries.length === 1 ? 'entry' : 'entries'}</span>
            {waitlistUpdatedAt && (
              <span className="owner-waitlist-updated">
                Updated {waitlistUpdatedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
          </div>
          {waitlistError && (
            <div role="alert" style={styles.errorMsg}>
              {waitlistError}{' '}
              <button type="button" onClick={fetchWaitlist} style={styles.btnOutline}>Try again</button>
            </div>
          )}
          {waitlistLoading && waitlistEntries.length === 0 ? (
            <p className="owner-waitlist-empty">Loading waitlist...</p>
          ) : waitlistError && waitlistEntries.length === 0 ? null : (
            filteredWaitlistEntries.length === 0 ? (
              <p className="owner-waitlist-empty">
                {waitlistEntries.length === 0
                  ? 'No active waitlist entries yet.'
                  : 'No active entries for this age group.'}
              </p>
            ) : (
              <div className="owner-waitlist-table-wrap">
                <table className="owner-waitlist-table">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Parent / Guardian</th>
                      <th scope="col">Age Group</th>
                      <th scope="col">Request Start Date</th>
                      <th scope="col">Phone</th>
                      <th scope="col">Email</th>
                      <th scope="col">Waitlist Joined On</th>
                      <th scope="col" className="owner-waitlist-notes">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWaitlistEntries.map((entry, index) => (
                      <tr key={entry._id}>
                        <td>{index + 1}</td>
                        <td>{entry.parent?.name || 'Parent'}</td>
                        <td>{AGE_GROUP_LABELS[entry.ageGroup] || entry.ageGroup}</td>
                        <td>{formatWaitlistDate(entry.expectedStartDate)}</td>
                        <td>{entry.parent?.phone || '—'}</td>
                        <td>{entry.parent?.email || '—'}</td>
                        <td>{formatWaitlistEnrollment(entry.createdAt)}</td>
                        <td className="owner-waitlist-notes">{entry.notes?.trim() || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
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
            { label: 'City or community *', name: 'city',         type: 'select' },
            { label: 'Daily rate ($) *', name: 'dailyRate', type: 'number' },
            { label: 'Provider type *', name: 'providerType', type: 'providerType' },
          ].map(f => (
            <div key={f.name} style={styles.field}>
              <label style={styles.label}>{f.label}</label>
              {f.type === 'providerType' ? (
                <>
                  <select
                    id={f.name}
                    name={f.name}
                    value={form.providerType}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  >
                    <option value="">Select provider type</option>
                    {PROVIDER_TYPES.map(providerType => (
                      <option key={providerType.value} value={providerType.value}>{providerType.label}</option>
                    ))}
                  </select>
                  {form.providerType && isEditing && (
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '10px', fontSize: '13px', lineHeight: 1.5, color: '#2C2C2A' }}>
                      <input
                        type="checkbox"
                        name="providerStatusAttestationConfirmed"
                        checked={form.providerStatusAttestationConfirmed}
                        onChange={handleChange}
                      />
                      <span>{form.providerType === 'licensedCentre'
                        ? 'I confirm that this centre currently holds a valid provincial child care licence, and I will update my listing if its licensing status changes.'
                        : form.providerType === 'regulatedFamilyHome'
                          ? 'I confirm that I operate this home daycare under a licensed family home day care agency, and I will update my listing if my approval status changes.'
                          : 'I confirm that this home daycare is not provincially licensed, and I will not represent or market it as a licensed child care program.'}</span>
                    </label>
                  )}
                </>
              ) : f.type === 'select' ? (
                <select
                  id={f.name}
                  name={f.name}
                  value={form[f.name]}
                  onChange={handleChange}
                  style={styles.input}
                  required
                  placeholder={f.name === 'phone' ? '10 digits, no spaces or punctuation' : undefined}
                  disabled={!cityOptions.length}
                >
                  <option value="">Select a Nova Scotia community</option>
                  {cityOptions.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              ) : (
                <>
                  <input
                    id={f.name}
                    type={f.type}
                    name={f.name}
                    value={form[f.name]}
                    onChange={handleChange}
                    style={styles.input}
                    required
                    min={f.name === 'dailyRate' ? '0' : undefined}
                    step={f.name === 'dailyRate' ? '0.01' : undefined}
                    pattern={f.name === 'phone' ? '[0-9]{10}' : undefined}
                    maxLength={
                      f.name === 'phone' ? 10 :
                      f.name === 'name' ? 65 :
                      f.name === 'address' ? 75 :
                      undefined
                    }
                    inputMode={f.name === 'phone' ? 'numeric' : undefined}
                    title={f.name === 'phone' ? 'Enter exactly 10 digits with no spaces or punctuation' : undefined}
                  />
                  {f.name === 'dailyRate' && (
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '10px', fontSize: '13px', lineHeight: 1.5, color: '#2C2C2A' }}>
                      <input
                        type="checkbox"
                        name="dailyRateAttestationConfirmed"
                        checked={form.dailyRateAttestationConfirmed}
                        onChange={handleChange}
                      />
                      <span>I confirm that the daily rate entered is accurate and is the fee parents are charged for this care, before any government fee reductions or subsidies.</span>
                    </label>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        <p role={cityOptionsError ? 'alert' : undefined} style={{ fontSize: '13px', color: cityOptionsError ? '#C62828' : '#777', marginTop: '10px' }}>
          {cityOptionsError || 'Listings are limited to communities in Nova Scotia.'}
        </p>
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
          <label style={styles.label} htmlFor="facebookPageLink">Facebook Page Url/Link (optional)</label>
          <input
            id="facebookPageLink"
            type="url"
            name="facebookPageLink"
            value={form.facebookPageLink}
            onChange={handleChange}
            placeholder="https://www.facebook.com/yourdaycare"
            style={styles.input}
          />
        </div>
        <div style={{ ...styles.field, marginTop: '12px' }}>
          <label style={styles.label}>Description *</label>
          <textarea name="description" value={form.description} onChange={handleChange}
            placeholder="Tell families about your routines, approach, hours, meals and outdoor space…"
            style={{ ...styles.input, height: '80px', resize: 'none' }} required />
          <p className="owner-description-note">
            Keep it truthful and respectful. Please don’t include children’s names or personal details.
          </p>
          {form.providerType === 'unlicensedHome' && (
            <p className="owner-description-note">
              Please don’t describe your service as licensed or regulated.
            </p>
          )}
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
              <label style={styles.label} htmlFor="maxChildren">{getCapacityDetails(form.providerType).label}</label>
              <input
                id="maxChildren"
                type="number"
                name="maxChildren"
                min="1"
                max={form.providerType === 'regulatedFamilyHome' ? 7 : form.providerType === 'unlicensedHome' ? 6 : undefined}
                step="1"
                value={form.maxChildren}
                onChange={handleChange}
                style={styles.input}
                required
              />
              <p className="owner-capacity-note">{getCapacityDetails(form.providerType).help}</p>
              {getCapacityDetails(form.providerType).confirmation && (
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '10px', fontSize: '13px', lineHeight: 1.5, color: '#2C2C2A' }}>
                  <input
                    type="checkbox"
                    name="capacityAttestationConfirmed"
                    checked={form.capacityAttestationConfirmed}
                    onChange={handleChange}
                  />
                  <span>{getCapacityDetails(form.providerType).confirmation}</span>
                </label>
              )}
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
            {form.ageRange.filter(age => AVAILABILITY_AGE_GROUPS.includes(age)).map(age => {
            const badge = spotLabel(form.availability[age]);
            return (
              <div key={age} style={styles.availItem}>
                <div style={styles.availAge}>{age}</div>
                <div style={styles.availCount}>{form.availability[age]}</div>
                <div style={{ ...styles.availBadge, background: badge.bg, color: badge.color }}>{badge.text}</div>
                <div style={styles.availBtns}>
                  <button disabled={!form.availability[age]} onClick={() => changeFormSpots(age, -1)} style={styles.availBtn}>−</button>
                  <button
                    disabled={AVAILABILITY_AGE_GROUPS.reduce((sum, group) => sum + Number(form.availability[group] || 0), 0) >= Number(form.maxChildren || 0)}
                    onClick={() => changeFormSpots(age, +1)}
                    style={styles.availBtn}
                  >+</button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="owner-availability-total">
          Total open spots: {AVAILABILITY_AGE_GROUPS.reduce((sum, age) => sum + Number(form.availability[age] || 0), 0)} / {form.maxChildren || 0}
        </p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📍 Location coordinates</h2>
        <p style={{ fontSize: '13px', color: '#9E9E9E', marginBottom: '12px' }}>
          Go to maps.google.com, right click your address and copy the coordinates.
        </p>
        <div style={styles.grid2}>
          <div style={styles.field}>
            <label style={styles.label}>Latitude</label>
            <input type="number" name="lat" value={form.coordinates.lat} onChange={handleCoords} placeholder="e.g. 44.6488" style={styles.input} step="0.0001" min="-90" max="90" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Longitude</label>
            <input type="number" name="lng" value={form.coordinates.lng} onChange={handleCoords} placeholder="e.g. -63.5752" style={styles.input} step="0.0001" min="-180" max="180" />
          </div>
        </div>
      </div>

      {status === 'error'   && <div style={styles.errorMsg}>{submitError || 'Complete all required fields.'}</div>}

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