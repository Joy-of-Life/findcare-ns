export default function ReviewCard({ review, onDelete, currentUserId }) {
  function renderStars(rating) {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < rating ? '#BA7517' : '#E8E6E0', fontSize: '16px' }}>★</span>
    ));
  }

  function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60)   return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  const initials = review.parent?.name
    ? review.parent.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'P';

  return (
    <div style={styles.card}>
      <div style={styles.top}>
        <div style={styles.left}>
          <div style={styles.avatar}>{initials}</div>
          <div>
            <div style={styles.name}>{review.parent?.name || 'Parent'}</div>
            <div style={styles.time}>{timeAgo(review.createdAt)}</div>
          </div>
        </div>
        <div style={styles.right}>
          <div style={styles.stars}>{renderStars(review.rating)}</div>
          {review.verified && (
            <span style={styles.verifiedBadge}>✓ Verified</span>
          )}
        </div>
      </div>
      <p style={styles.text}>{review.text}</p>
      {currentUserId === review.parent?._id && (
        <button onClick={() => onDelete(review._id)} style={styles.deleteBtn}>
          Delete
        </button>
      )}
    </div>
  );
}

const styles = {
  card:          { background: '#F8F7F4', borderRadius: '10px', padding: '14px', marginBottom: '10px', border: '1px solid #E8E6E0' },
  top:           { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' },
  left:          { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar:        { width: '36px', height: '36px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '500', color: '#085041' },
  name:          { fontSize: '13px', fontWeight: '500', color: '#2C2C2A' },
  time:          { fontSize: '11px', color: '#6B7280', marginTop: '2px' },
  right:         { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' },
  stars:         { display: 'flex', gap: '1px' },
  verifiedBadge: { fontSize: '11px', color: '#085041', background: '#E1F5EE', padding: '2px 7px', borderRadius: '20px' },
  text:          { fontSize: '13px', color: '#374151', lineHeight: '1.6' },
  deleteBtn:     { fontSize: '12px', color: '#A32D2D', background: 'none', border: 'none', cursor: 'pointer', marginTop: '8px', padding: '0' },
};