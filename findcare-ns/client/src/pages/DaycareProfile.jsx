import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReviewCard  from '../components/ReviewCard';
import MapView     from '../components/MapView';
import LicensingBadge from '../components/LicensingBadge';
import ListingDisclaimer from '../components/ListingDisclaimer';
import { AGE_GROUP_LABELS, AGE_GROUP_OPTIONS, AVAILABILITY_AGE_GROUPS } from '../constants/ageGroups';
import { formatDailyRate } from '../utils/pricing';
import { getDaycareRatingStatus } from '../utils/daycareRating';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function getNovaScotiaTomorrowDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Halifax',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const tomorrow = new Date(Date.UTC(
    Number(dateParts.year),
    Number(dateParts.month) - 1,
    Number(dateParts.day) + 1
  ));
  return tomorrow.toISOString().slice(0, 10);
}

export default function DaycareProfile() {
  const { id }              = useParams();
  const { user, token }     = useAuth();
  const navigate            = useNavigate();
  const location            = useLocation();
  const resumedWaitlist     = useRef(false);
  const [daycare, setDaycare]           = useState(null);
  const [reviews, setReviews]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState('');
  const [form, setForm]                 = useState({ rating: 5 });
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [waitlistForm, setWaitlistForm] = useState({ ageGroup: '', expectedStartDate: '', notes: '' });
  const [waitlistMsg, setWaitlistMsg]   = useState('');
  const [onWaitlist, setOnWaitlist]     = useState(false);
  const earliestWaitlistStartDate = getNovaScotiaTomorrowDate();

  useEffect(() => { fetchDaycare(); fetchReviews(); }, [id]);

  async function fetchDaycare() {
    try {
      const res  = await fetch(`${API_URL}/api/daycares/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setDaycare(null);
          return;
        }
        throw new Error(`Daycare request failed with status ${res.status}`);
      }
      const data = await res.json();
      setDaycare(data);
      setLoadError('');
    } catch (err) {
      console.error(err);
      setLoadError('Unable to load this daycare. Please check your connection and try again.');
    }
    finally { setLoading(false); }
  }

  async function fetchReviews() {
    try {
      const res  = await fetch(`${API_URL}/api/reviews/${id}`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  }

  async function submitReview() {
    if (!user) { navigate('/login'); return; }
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      const res  = await fetch(`${API_URL}/api/reviews/${id}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({ rating: form.rating })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to submit review'); }
      else {
        setSuccess('Rating submitted! 🎉');
        setReviews(prev => [data, ...prev]);
        setForm({ rating: 5 });
        await fetchDaycare();
      }
    } catch (err) { setError('Something went wrong.'); }
    finally { setSubmitting(false); }
  }

  const submitWaitlist = useCallback(async (formData) => {
    setWaitlistMsg('');
    if (!formData.expectedStartDate || formData.expectedStartDate < earliestWaitlistStartDate) {
      setWaitlistMsg('Requested start date must be tomorrow or a future date.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/waitlist/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) { setWaitlistMsg(data.error || 'Failed to join waitlist'); }
      else { setOnWaitlist(true); setWaitlistMsg(`You are on the waitlist at position #${data.position}!`); }
    } catch (err) { setWaitlistMsg('Something went wrong.'); }
  }, [earliestWaitlistStartDate, id, token]);

  useEffect(() => {
    const pendingWaitlist = location.state?.resumeWaitlist;
    if (resumedWaitlist.current || !pendingWaitlist?.ageGroup || user?.role !== 'parent' || !token) return;
    resumedWaitlist.current = true;
    setWaitlistForm(pendingWaitlist);
    navigate(location.pathname, { replace: true, state: null });
    submitWaitlist(pendingWaitlist);
  }, [location.pathname, location.state, navigate, submitWaitlist, token, user]);

  function joinWaitlist() {
    if (!waitlistForm.ageGroup) { setWaitlistMsg('Please select an age group.'); return; }
    if (!waitlistForm.expectedStartDate || waitlistForm.expectedStartDate < earliestWaitlistStartDate) {
      setWaitlistMsg('Requested start date must be tomorrow or a future date.');
      return;
    }
    if (!user) {
      navigate('/login', {
        state: { returnTo: location.pathname, pendingWaitlist: waitlistForm }
      });
      return;
    }
    submitWaitlist(waitlistForm);
  }

  function renderStars(rating, interactive = false) {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        onClick={() => interactive && setForm({ ...form, rating: i + 1 })}
        style={{
          color:    i < (interactive ? form.rating : rating) ? '#FF6B35' : '#FFE0B2',
          fontSize: interactive ? '28px' : '18px',
          cursor:   interactive ? 'pointer' : 'default',
        }}
      >★</span>
    ));
  }

  if (loading) return <div style={styles.loading}>🔍 Loading...</div>;
  if (loadError) return <div role="alert" style={styles.loading}>{loadError}</div>;
  if (!daycare) return <div style={styles.loading}>😕 Daycare not found.</div>;

  const totalSpots = AVAILABILITY_AGE_GROUPS.reduce(
    (total, age) => total + (daycare.availability?.[age] || 0),
    0
  );
  const ratingStatus = getDaycareRatingStatus(daycare);
  const ratingCount = daycare.reviewCount || reviews.length;
  const currentUserId = user?.id || user?._id;
  const hasRated = Boolean(currentUserId && reviews.some(
    review => String(review.parent?._id || review.parent) === String(currentUserId)
  ));
  const returnToDashboard = location.state?.returnTo === '/dashboard';

  return (
    <div style={styles.page}>
      <button
        onClick={() => {
          const returnTo = location.state?.returnTo;
          navigate(
            typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')
              ? returnTo
              : '/',
            { replace: true }
          );
        }}
        style={styles.backBtn}
      >
        {returnToDashboard ? '← Back to dashboard' : '← Back to results'}
      </button>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{daycare.name}</h1>
          <p style={styles.address}>📍 {daycare.hideAddress ? daycare.city : `${daycare.address}, ${daycare.city}`}</p>
          <div style={styles.tags}>
            {daycare.ageRange?.map(age  => <span key={age}  style={styles.tagOrange}>{AGE_GROUP_LABELS[age] || age}</span>)}
            {daycare.language?.map(lang => <span key={lang} style={styles.tagPurple}>{lang}</span>)}
            <LicensingBadge licensed={daycare.licensed} providerType={daycare.providerType} />
            {daycare.verified && <span style={styles.tagGreen}>✓ Verified</span>}
          </div>
        </div>
        <div style={styles.ratingBlock}>
          {ratingStatus.type === 'rated' ? (
            <>
              <div style={styles.ratingNumber}>{ratingStatus.rating}</div>
              <div style={{ display: 'flex' }}>{renderStars(ratingStatus.rating)}</div>
              <div style={styles.reviewCount}>{ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}</div>
            </>
          ) : (
            <div style={{ ...styles.ratingNumber, fontSize: '14px' }}>{ratingStatus.label}</div>
          )}
        </div>
      </div>

      {/* Key info */}
      <div style={styles.infoGrid}>
        {[
          { label: 'Daily rate',    value: formatDailyRate(daycare.dailyRate),                             icon: '💰' },
          { label: 'Open hours',    value: daycare.openHours,                                              icon: '🕐' },
          { label: 'Phone',         value: daycare.phone,                                                  icon: '📞' },
          { label: 'Open spots',    value: totalSpots > 0 ? `${totalSpots} available` : 'Waitlist only',   icon: '🎈' },
        ].map(info => (
          <div key={info.label} style={styles.infoCard}>
            <div style={styles.infoIcon}>{info.icon}</div>
            <div style={styles.infoLabel}>{info.label}</div>
            <div style={styles.infoValue}>{info.value}</div>
          </div>
        ))}
      </div>

      {/* Availability */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>🔔 Real-time availability</h2>
        <div style={styles.availGrid}>
          {daycare.ageRange
            ?.filter(age => AVAILABILITY_AGE_GROUPS.includes(age))
            .map(age => {
            const spots = daycare.availability?.[age] || 0;
            return (
              <div key={age} style={styles.availItem}>
                <div style={styles.availAge}>{age}</div>
                <div style={styles.availCount}>{spots}</div>
                <div style={{
                  ...styles.availBadge,
                  background: spots > 0 ? '#E8F5E9' : '#FFF3E0',
                  color:      spots > 0 ? '#2E7D32' : '#E65100',
                }}>
                  {spots > 0 ? 'spots open' : 'waitlist'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Description */}
      {daycare.description && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🏫 About this daycare</h2>
          <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.7' }}>{daycare.description}</p>
        </div>
      )}

      {daycare.facebookPageLink && (
        <div style={styles.facebookPageCard}>
          <a
            href={daycare.facebookPageLink}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.facebookPageLink}
          >
            ✨ Facebook Page of {daycare.name}
          </a>
        </div>
      )}

      {/* Map */}
      {daycare.coordinates?.lat && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📍 Location</h2>
          <MapView daycares={[daycare]} />
        </div>
      )}

      {/* Waitlist — parents only */}
      {(!user || user.role === 'parent') && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📋 Join the waitlist</h2>
          <p style={{ fontSize: '14px', color: '#9E9E9E', marginBottom: '14px' }}>
            No spots available right now? Join the waitlist and you'll be notified when one opens up.
          </p>
          {!onWaitlist ? (
            <>
              <div style={{ marginBottom: '12px' }}>
                <label style={styles.label}>Age group needed</label>
                <select
                  value={waitlistForm.ageGroup}
                  onChange={e => setWaitlistForm({ ...waitlistForm, ageGroup: e.target.value })}
                  style={styles.input}
                >
                  <option value="">Select age group</option>
                  {AGE_GROUP_OPTIONS.map(({ value, label, range }) => (
                    <option key={value} value={value}>{label} ({range})</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={styles.label} htmlFor="waitlist-expected-start-date">Requested start date *</label>
                <input
                  id="waitlist-expected-start-date"
                  type="date"
                  required
                  min={earliestWaitlistStartDate}
                  value={waitlistForm.expectedStartDate}
                  onChange={e => setWaitlistForm({ ...waitlistForm, expectedStartDate: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={styles.label}>Notes (optional)</label>
                <textarea
                  value={waitlistForm.notes}
                  onChange={e => setWaitlistForm({ ...waitlistForm, notes: e.target.value })}
                  placeholder="Any special requirements..."
                  style={{ ...styles.input, height: '70px', resize: 'none' }}
                />
              </div>
              {waitlistMsg && (
                <div style={{
                  padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px',
                  background:   waitlistMsg.includes('position') ? '#E8F5E9' : '#FFEBEE',
                  color:        waitlistMsg.includes('position') ? '#2E7D32' : '#C62828',
                  border:       `1px solid ${waitlistMsg.includes('position') ? '#A5D6A7' : '#EF9A9A'}`,
                }}>
                  {waitlistMsg}
                </div>
              )}
              <button onClick={joinWaitlist} style={styles.btnOrange}>📋 Join waitlist</button>
            </>
          ) : (
            <div style={{ background: '#E8F5E9', padding: '16px', borderRadius: '10px', border: '1px solid #A5D6A7' }}>
              <p style={{ fontSize: '14px', color: '#2E7D32', fontWeight: '600' }}>✅ You are on the waitlist!</p>
              <p style={{ fontSize: '13px', color: '#2E7D32', marginTop: '4px' }}>{waitlistMsg}</p>
              <p style={{ fontSize: '13px', color: '#2E7D32', marginTop: '4px' }}>
                Track your position in your{' '}
                <span onClick={() => navigate('/dashboard')} style={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: '600' }}>
                  parent dashboard
                </span>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Parent ratings */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>⭐ Parent ratings ({reviews.length})</h2>

        {success && <div style={styles.successMsg}>{success}</div>}

        {user && user.role === 'parent' && !hasRated && (
          <div style={styles.reviewForm}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#2C2C2A', marginBottom: '14px' }}>Rate this daycare</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={styles.label}>Your rating</label>
              <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                {renderStars(form.rating, true)}
              </div>
            </div>
            {error   && <div style={styles.errorMsg}>{error}</div>}
            <button onClick={submitReview} disabled={submitting} style={styles.btnOrange}>
              {submitting ? 'Submitting...' : '⭐ Submit rating'}
            </button>
          </div>
        )}

        {user?.role === 'parent' && hasRated && (
          <p style={{ fontSize: '14px', color: '#2E7D32', marginBottom: '16px' }}>
            You have already rated this daycare. To request a rating update, email{' '}
            <a href="mailto:support@findcarens.com" style={{ color: 'inherit', fontWeight: '600' }}>
              support@findcarens.com
            </a>.
          </p>
        )}

        {!user && (
          <div style={{ background: '#FFF3E0', borderRadius: '10px', padding: '16px', marginBottom: '16px', textAlign: 'center', border: '1px solid #FFCC80' }}>
            <p style={{ fontSize: '14px', color: '#E65100', marginBottom: '10px' }}>
              Log in as a parent to rate this daycare.
            </p>
            <button onClick={() => navigate('/login')} style={styles.btnOrange}>Log in</button>
          </div>
        )}

        {reviews.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#9E9E9E', marginTop: '16px' }}>
            No ratings yet — be the first to rate this daycare! ⭐
          </p>
        ) : (
          <div style={{ marginTop: '16px' }}>
            {reviews.map(review => (
              <ReviewCard key={review._id} review={review} />
            ))}
          </div>
        )}
      </div>

      <footer style={{ padding: '12px 4px 4px', borderTop: '1px solid #FFE0B2' }}>
        <ListingDisclaimer />
      </footer>
    </div>
  );
}

const styles = {
  page:         { maxWidth: '720px', margin: '0 auto', padding: '24px 16px', background: '#FFFDF9', minHeight: '100vh' },
  loading:      { textAlign: 'center', padding: '60px', color: '#FF6B35', fontSize: '16px' },
  backBtn:      { fontSize: '13px', color: '#9E9E9E', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', padding: '0' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  title:        { fontSize: '24px', fontWeight: '700', color: '#2C2C2A', marginBottom: '6px' },
  address:      { fontSize: '14px', color: '#9E9E9E', marginBottom: '10px' },
  tags:         { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  tagOrange:    { fontSize: '12px', background: '#FFF3E0', color: '#E65100', padding: '3px 10px', borderRadius: '20px', border: '1px solid #FFCC80' },
  tagPurple:    { fontSize: '12px', background: '#EDE7F6', color: '#5C35CC', padding: '3px 10px', borderRadius: '20px', border: '1px solid #B39DDB' },
  tagGreen:     { fontSize: '12px', background: '#E8F5E9', color: '#2E7D32', padding: '3px 10px', borderRadius: '20px', border: '1px solid #A5D6A7' },
  ratingBlock:  { textAlign: 'center' },
  ratingNumber: { fontSize: '36px', fontWeight: '700', color: '#FF6B35' },
  reviewCount:  { fontSize: '12px', color: '#9E9E9E', marginTop: '2px' },
  infoGrid:     { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '16px' },
  infoCard:     { background: '#fff', border: '1.5px solid #FFE0B2', borderRadius: '12px', padding: '14px', textAlign: 'center' },
  infoIcon:     { fontSize: '20px', marginBottom: '4px' },
  infoLabel:    { fontSize: '11px', color: '#9E9E9E', marginBottom: '4px' },
  infoValue:    { fontSize: '15px', fontWeight: '600', color: '#2C2C2A' },
  card:         { background: '#fff', border: '1.5px solid #FFE0B2', borderRadius: '16px', padding: '20px', marginBottom: '16px' },
  cardTitle:    { fontSize: '16px', fontWeight: '600', color: '#2C2C2A', marginBottom: '14px' },
  facebookPageCard: {
    marginBottom: '16px',
    padding: '14px 18px',
    border: '1px solid #C7D7FE',
    borderRadius: '14px',
    background: 'linear-gradient(110deg, #EEF4FF, #F5F0FF)',
  },
  facebookPageLink: {
    display: 'inline-flex',
    alignItems: 'center',
    color: '#3157A4',
    fontSize: '15px',
    fontWeight: '700',
    textDecoration: 'none',
  },
  availGrid:    { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  availItem:    { border: '1.5px solid #FFE0B2', borderRadius: '10px', padding: '14px', textAlign: 'center', background: '#FFFDF9' },
  availAge:     { fontSize: '12px', color: '#9E9E9E', marginBottom: '6px', textTransform: 'capitalize' },
  availCount:   { fontSize: '28px', fontWeight: '700', color: '#FF6B35' },
  availBadge:   { fontSize: '11px', marginTop: '4px', padding: '2px 8px', borderRadius: '20px', display: 'inline-block' },
  label:        { fontSize: '13px', color: '#555', fontWeight: '500', display: 'block', marginBottom: '6px' },
  input:        { width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #FFCC80', fontSize: '13px', color: '#2C2C2A', background: '#FFFDF9', fontFamily: 'inherit', outline: 'none' },
  reviewForm:   { background: '#FFFDF9', borderRadius: '10px', padding: '16px', marginBottom: '16px', border: '1.5px solid #FFE0B2' },
  successMsg:   { background: '#E8F5E9', color: '#2E7D32', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px', border: '1px solid #A5D6A7' },
  errorMsg:     { background: '#FFEBEE', color: '#C62828', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px', border: '1px solid #EF9A9A' },
  btnOrange:    { padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#FF6B35', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
};