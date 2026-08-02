import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReviewCard  from '../components/ReviewCard';
import MapView     from '../components/MapView';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function DaycareProfile() {
  const { id }              = useParams();
  const { user, token }     = useAuth();
  const navigate            = useNavigate();
  const [daycare, setDaycare]   = useState(null);
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState({ rating: 5, text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  useEffect(() => {
    fetchDaycare();
    fetchReviews();
  }, [id]);

  async function fetchDaycare() {
    try {
      const res  = await fetch(`${API_URL}/api/daycares/${id}`);
      const data = await res.json();
      setDaycare(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReviews() {
    try {
      const res  = await fetch(`${API_URL}/api/reviews/${id}`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }

  async function submitReview() {
    if (!user) { navigate('/login'); return; }
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res  = await fetch(`${API_URL}/api/reviews/${id}`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit review');
      } else {
        setSuccess('Review submitted!');
        setReviews(prev => [data, ...prev]);
        setForm({ rating: 5, text: '' });
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteReview(reviewId) {
    try {
      await fetch(`${API_URL}/api/reviews/${reviewId}`, {
        method:  'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setReviews(prev => prev.filter(r => r._id !== reviewId));
    } catch (err) {
      console.error(err);
    }
  }

  function renderStars(rating, interactive = false) {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        onClick={() => interactive && setForm({ ...form, rating: i + 1 })}
        style={{
          color:    i < (interactive ? form.rating : rating) ? '#BA7517' : '#E8E6E0',
          fontSize: interactive ? '28px' : '18px',
          cursor:   interactive ? 'pointer' : 'default',
        }}
      >★</span>
    ));
  }

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!daycare) return <div style={styles.loading}>Daycare not found.</div>;

  const totalSpots = (daycare.availability?.infant    || 0) +
                     (daycare.availability?.toddler   || 0) +
                     (daycare.availability?.preschool || 0);

  return (
    <div style={styles.page}>

      {/* Back button */}
      <button onClick={() => navigate(-1)} style={styles.backBtn}>
        ← Back to results
      </button>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{daycare.name}</h1>
          <p style={styles.address}>📍 {daycare.address}, {daycare.city}</p>
          <div style={styles.tags}>
            {daycare.ageRange?.map(age => (
              <span key={age} style={styles.tagGreen}>{age}</span>
            ))}
            {daycare.language?.map(lang => (
              <span key={lang} style={styles.tagPurple}>{lang}</span>
            ))}
            {daycare.licensed && (
              <span style={styles.tagBlue}>✓ Licensed</span>
            )}
            {daycare.verified && (
              <span style={styles.tagBlue}>✓ Verified</span>
            )}
          </div>
        </div>
        <div style={styles.ratingBlock}>
          <div style={styles.ratingNumber}>{daycare.rating || 'New'}</div>
          <div style={{ display: 'flex' }}>{renderStars(daycare.rating)}</div>
          <div style={styles.reviewCount}>{daycare.reviewCount || 0} reviews</div>
        </div>
      </div>

      {/* Key info cards */}
      <div style={styles.infoGrid}>
        {[
          { label: 'Monthly price', value: `$${daycare.monthlyPrice}` },
          { label: 'Open hours',    value: daycare.openHours          },
          { label: 'Phone',         value: daycare.phone              },
          { label: 'Open spots',    value: totalSpots > 0 ? `${totalSpots} available` : 'Waitlist only' },
        ].map(info => (
          <div key={info.label} style={styles.infoCard}>
            <div style={styles.infoLabel}>{info.label}</div>
            <div style={styles.infoValue}>{info.value}</div>
          </div>
        ))}
      </div>

      {/* Availability */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Real-time availability</h2>
        <div style={styles.availGrid}>
          {['infant', 'toddler', 'preschool'].map(age => {
            const spots = daycare.availability?.[age] || 0;
            return (
              <div key={age} style={styles.availItem}>
                <div style={styles.availAge}>{age}</div>
                <div style={styles.availCount}>{spots}</div>
                <div style={{
                  ...styles.availBadge,
                  background: spots > 0 ? '#E1F5EE' : '#FAEEDA',
                  color:      spots > 0 ? '#085041' : '#854F0B',
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
          <h2 style={styles.cardTitle}>About this daycare</h2>
          <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.7' }}>
            {daycare.description}
          </p>
        </div>
      )}

      {/* Map */}
      {daycare.coordinates?.lat && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Location</h2>
          <MapView daycares={[daycare]} />
        </div>
      )}

      {/* Reviews */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>
          Parent reviews ({reviews.length})
        </h2>

        {/* Submit review form */}
        {user && user.role === 'parent' && (
          <div style={styles.reviewForm}>
            <h3 style={styles.reviewFormTitle}>Leave a review</h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={styles.label}>Your rating</label>
              <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                {renderStars(form.rating, true)}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={styles.label}>Your review</label>
              <textarea
                value={form.text}
                onChange={e => setForm({ ...form, text: e.target.value })}
                placeholder="Share your experience with this daycare (minimum 20 characters)..."
                style={styles.textarea}
              />
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
                {form.text.length} / 1000 characters
              </div>
            </div>

            {error   && <div style={styles.errorMsg}>{error}</div>}
            {success && <div style={styles.successMsg}>{success}</div>}

            <button
              onClick={submitReview}
              disabled={submitting}
              style={styles.submitBtn}
            >
              {submitting ? 'Submitting...' : 'Submit review'}
            </button>
          </div>
        )}

        {!user && (
          <div style={styles.loginPrompt}>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '10px' }}>
              Log in as a parent to leave a review.
            </p>
            <button onClick={() => navigate('/login')} style={styles.btnGreen}>
              Log in
            </button>
          </div>
        )}

        {/* Review list */}
        {reviews.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '16px' }}>
            No reviews yet — be the first to review this daycare!
          </p>
        ) : (
          <div style={{ marginTop: '16px' }}>
            {reviews.map(review => (
              <ReviewCard
                key={review._id}
                review={review}
                onDelete={deleteReview}
                currentUserId={user?.id}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

const styles = {
  page:          { maxWidth: '720px', margin: '0 auto', padding: '24px 16px', background: '#F8F7F4', minHeight: '100vh' },
  loading:       { textAlign: 'center', padding: '60px', color: '#6B7280', fontSize: '14px' },
  backBtn:       { fontSize: '13px', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', padding: '0' },
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  title:         { fontSize: '24px', fontWeight: '500', color: '#2C2C2A', marginBottom: '6px' },
  address:       { fontSize: '14px', color: '#6B7280', marginBottom: '10px' },
  tags:          { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  tagGreen:      { fontSize: '12px', background: '#E1F5EE', color: '#085041', padding: '3px 10px', borderRadius: '20px' },
  tagPurple:     { fontSize: '12px', background: '#EEEDFE', color: '#534AB7', padding: '3px 10px', borderRadius: '20px' },
  tagBlue:       { fontSize: '12px', background: '#E6F1FB', color: '#185FA5', padding: '3px 10px', borderRadius: '20px' },
  ratingBlock:   { textAlign: 'center' },
  ratingNumber:  { fontSize: '36px', fontWeight: '700', color: '#2C2C2A' },
  reviewCount:   { fontSize: '12px', color: '#6B7280', marginTop: '2px' },
  infoGrid:      { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '16px' },
  infoCard:      { background: '#fff', border: '1px solid #E8E6E0', borderRadius: '10px', padding: '14px' },
  infoLabel:     { fontSize: '12px', color: '#6B7280', marginBottom: '4px' },
  infoValue:     { fontSize: '15px', fontWeight: '500', color: '#2C2C2A' },
  card:          { background: '#fff', border: '1px solid #E8E6E0', borderRadius: '12px', padding: '20px', marginBottom: '16px' },
  cardTitle:     { fontSize: '16px', fontWeight: '500', color: '#2C2C2A', marginBottom: '14px' },
  availGrid:     { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  availItem:     { border: '1px solid #E8E6E0', borderRadius: '10px', padding: '14px', textAlign: 'center' },
  availAge:      { fontSize: '12px', color: '#6B7280', marginBottom: '6px', textTransform: 'capitalize' },
  availCount:    { fontSize: '28px', fontWeight: '500', color: '#2C2C2A' },
  availBadge:    { fontSize: '11px', marginTop: '4px', padding: '2px 8px', borderRadius: '20px', display: 'inline-block' },
  reviewForm:    { background: '#F8F7F4', borderRadius: '10px', padding: '16px', marginBottom: '16px', border: '1px solid #E8E6E0' },
  reviewFormTitle:{ fontSize: '14px', fontWeight: '500', color: '#2C2C2A', marginBottom: '14px' },
  label:         { fontSize: '13px', color: '#374151', fontWeight: '500' },
  textarea:      { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E8E6E0', fontSize: '13px', color: '#2C2C2A', background: '#fff', height: '100px', resize: 'vertical', marginTop: '6px', fontFamily: 'inherit' },
  errorMsg:      { background: '#FCEBEB', color: '#A32D2D', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' },
  successMsg:    { background: '#E1F5EE', color: '#085041', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' },
  submitBtn:     { padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#1D9E75', color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
  loginPrompt:   { background: '#F8F7F4', borderRadius: '10px', padding: '16px', marginBottom: '16px', textAlign: 'center' },
  btnGreen:      { padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#1D9E75', color: '#fff', fontSize: '13px', cursor: 'pointer' },
};