import { useState, useEffect } from 'react';
import { useAuth }     from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function ParentDashboard() {
  const { user, token } = useAuth();
  const navigate        = useNavigate();
  const [savedDaycares, setSavedDaycares] = useState([]);
  const [waitlist, setWaitlist]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [alertsOn, setAlertsOn]           = useState(false);

  useEffect(() => {
    if (user) {
      fetchSavedDaycares();
      fetchWaitlist();
    }
  }, [user]);

  async function fetchSavedDaycares() {
    try {
      const res  = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.alertPrefs?.email === true) setAlertsOn(true);
      if (data.savedDaycares?.length > 0) {
        const details = await Promise.all(
          data.savedDaycares.map(id =>
            fetch(`${API_URL}/api/daycares/${id}`).then(r => r.json())
          )
        );
        setSavedDaycares(details.filter(d => d._id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchWaitlist() {
    try {
      const res  = await fetch(`${API_URL}/api/waitlist/my/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setWaitlist(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }

  async function unsaveDaycare(daycareId) {
    try {
      await fetch(`${API_URL}/api/auth/save-daycare`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({ daycareId })
      });
      setSavedDaycares(prev => prev.filter(d => d._id !== daycareId));
    } catch (err) { console.error(err); }
  }

  async function leaveWaitlist(daycareId, ageGroup) {
    try {
      await fetch(`${API_URL}/api/waitlist/${daycareId}`, {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({ ageGroup })
      });
      setWaitlist(prev => prev.filter(
        w => !(w.daycare._id === daycareId && w.ageGroup === ageGroup)
      ));
    } catch (err) { console.error(err); }
  }

  async function toggleAlerts() {
    try {
      if (alertsOn) {
        const res = await fetch(`${API_URL}/api/alerts/unsubscribe`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setAlertsOn(false);
      } else {
        const res = await fetch(`${API_URL}/api/alerts/subscribe`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body:    JSON.stringify({ ageGroups: ['infant', 'toddler', 'preschool'] })
        });
        if (res.ok) setAlertsOn(true);
      }
    } catch (err) { console.error(err); }
  }

  function getAvailabilityStatus(daycare) {
    const total = (daycare.availability?.infant    || 0) +
                  (daycare.availability?.toddler   || 0) +
                  (daycare.availability?.preschool || 0);
    if (total > 0) return { text: `${total} spots open`, bg: '#E8F5E9', color: '#2E7D32' };
    return { text: 'Waitlist only', bg: '#FFF3E0', color: '#E65100' };
  }

  if (!user) {
    return (
      <div style={styles.page}>
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>👨‍👩‍👧</div>
          <h2 style={styles.emptyTitle}>Parent dashboard</h2>
          <p style={styles.emptySub}>Log in to access your dashboard.</p>
          <button onClick={() => navigate('/login')} style={styles.btnOrange}>Log in</button>
        </div>
      </div>
    );
  }

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div style={styles.page}>

      {/* Top bar */}
      <div style={styles.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={styles.avatar}>{initials}</div>
          <div>
            <div style={styles.userName}>{user.name} 👋</div>
            <div style={styles.userSub}>Parent account · Nova Scotia</div>
          </div>
        </div>
        <button onClick={() => navigate('/')} style={styles.btnOrange}>
          🔍 Find daycares
        </button>
      </div>

      {/* Metric cards */}
      <div style={styles.metrics}>
        {[
          { icon: '❤️', label: 'Saved',     value: savedDaycares.length,        sub: 'daycares'     },
          { icon: '📋', label: 'Waitlists', value: waitlist.length,              sub: 'active'       },
          { icon: '🔔', label: 'Alerts',    value: alertsOn ? 'On' : 'Off',      sub: 'email alerts' },
          { icon: '💬', label: 'Messages',  value: 0,                            sub: 'unread'       },
        ].map(m => (
          <div key={m.label} style={styles.metric}>
            <div style={styles.metricIcon}>{m.icon}</div>
            <div style={styles.metricValue}>{m.value}</div>
            <div style={styles.metricLabel}>{m.label}</div>
            <div style={styles.metricSub}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Saved daycares */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>
          <span>❤️ Saved daycares</span>
          <button onClick={() => navigate('/')} style={styles.btnLink}>Find more →</button>
        </div>
        {loading && <p style={styles.loadingText}>Loading...</p>}
        {!loading && savedDaycares.length === 0 && (
          <div style={styles.emptySection}>
            <p style={styles.emptySectionText}>No saved daycares yet. Search and click ♡ Save to add them here.</p>
            <button onClick={() => navigate('/')} style={styles.btnOrange}>Search daycares</button>
          </div>
        )}
        {savedDaycares.map(daycare => {
          const status = getAvailabilityStatus(daycare);
          return (
            <div key={daycare._id} style={styles.daycareRow}>
              <div style={{ flex: 1 }}>
                <div
                  style={{ ...styles.daycareName, cursor: 'pointer' }}
                  onClick={() => navigate(`/daycare/${daycare._id}`)}
                >
                  {daycare.name}
                </div>
                <div style={styles.daycareAddr}>📍 {daycare.address}, {daycare.city}</div>
                <div style={styles.tags}>
                  {daycare.ageRange?.map(age => (
                    <span key={age} style={styles.tagOrange}>{age}</span>
                  ))}
                  {daycare.language?.map(lang => (
                    <span key={lang} style={styles.tagPurple}>{lang}</span>
                  ))}
                  <span style={{ ...styles.tagOrange, background: status.bg, color: status.color, border: `1px solid ${status.color}30` }}>
                    {status.text}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                <span style={styles.price}>${daycare.monthlyPrice}/mo</span>
                <button onClick={() => unsaveDaycare(daycare._id)} style={styles.btnRemove}>Remove</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Waitlist tracker */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>
          <span>📋 Waitlist tracker</span>
          <button onClick={() => navigate('/')} style={styles.btnLink}>Find daycares →</button>
        </div>
        {waitlist.length === 0 ? (
          <p style={styles.emptySectionText}>
            Not on any waitlists yet. Visit a daycare profile to join a waitlist.
          </p>
        ) : (
          waitlist.map(entry => (
            <div key={entry._id} style={styles.waitlistRow}>
              <div style={{ flex: 1 }}>
                <div
                  style={{ ...styles.daycareName, cursor: 'pointer' }}
                  onClick={() => navigate(`/daycare/${entry.daycare._id}`)}
                >
                  {entry.daycare?.name}
                </div>
                <div style={styles.daycareAddr}>
                  📍 {entry.daycare?.city} · {entry.ageGroup}
                </div>
                <div style={styles.progressWrap}>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${Math.min(100, (1 / entry.position) * 100)}%` }} />
                  </div>
                  <span style={styles.positionText}>Position #{entry.position}</span>
                </div>
              </div>
              <button onClick={() => leaveWaitlist(entry.daycare._id, entry.ageGroup)} style={styles.btnRemove}>
                Leave
              </button>
            </div>
          ))
        )}
      </div>

      {/* Spot alerts */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>
          <span>🔔 Spot alerts</span>
          <span style={{
            fontSize: '12px', padding: '3px 10px', borderRadius: '20px', border: '1px solid',
            background:   alertsOn ? '#FFF3E0' : '#F8F7F4',
            color:        alertsOn ? '#E65100' : '#9E9E9E',
            borderColor:  alertsOn ? '#FFCC80' : '#E8E6E0',
          }}>
            {alertsOn ? '🔔 Alerts on' : '🔕 Alerts off'}
          </span>
        </div>
        <p style={styles.emptySectionText}>
          Get an email when a spot opens at any of your saved daycares.
        </p>

        {alertsOn && savedDaycares.length === 0 && (
          <div style={styles.alertWarning}>
            <span style={{ fontSize: '16px' }}>💡</span>
            <p style={{ fontSize: '13px', color: '#E65100', margin: 0, lineHeight: '1.5' }}>
              Alerts are on but you haven't saved any daycares yet. You'll only receive alerts for daycares you save.{' '}
              <span onClick={() => navigate('/')} style={{ fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>
                Find and save daycares →
              </span>
            </p>
          </div>
        )}

        {alertsOn && savedDaycares.length > 0 && (
          <div style={styles.alertSuccess}>
            <span>✅</span>
            <p style={{ fontSize: '13px', color: '#2E7D32', margin: 0 }}>
              You'll receive alerts when spots open at your {savedDaycares.length} saved daycare{savedDaycares.length !== 1 ? 's' : ''}.
            </p>
          </div>
        )}

        <button
          onClick={toggleAlerts}
          style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '13px',
            cursor: 'pointer', fontWeight: '500', marginTop: '12px',
            background: alertsOn ? '#FFEBEE' : '#FF6B35',
            color:      alertsOn ? '#C62828' : '#fff',
          }}
        >
          {alertsOn ? '🔕 Turn off alerts' : '🔔 Turn on alerts'}
        </button>
      </div>

      {/* Messages */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>💬 Messages</div>
        <p style={styles.emptySectionText}>Messages from daycare owners will appear here.</p>
        <button onClick={() => navigate('/messages')} style={styles.btnOrange}>
          Go to messages
        </button>
      </div>

    </div>
  );
}

const styles = {
  page:           { maxWidth: '720px', margin: '0 auto', padding: '32px 16px', background: '#FFFDF9', minHeight: '100vh' },
  topbar:         { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '20px', borderBottom: '2px solid #FFE0B2' },
  avatar:         { width: '44px', height: '44px', borderRadius: '50%', background: '#FF6B35', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: '#fff' },
  userName:       { fontSize: '16px', fontWeight: '600', color: '#2C2C2A' },
  userSub:        { fontSize: '12px', color: '#9E9E9E' },
  metrics:        { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px', marginBottom: '24px' },
  metric:         { background: '#fff', borderRadius: '12px', padding: '14px', border: '1.5px solid #FFE0B2', textAlign: 'center' },
  metricIcon:     { fontSize: '20px', marginBottom: '4px' },
  metricValue:    { fontSize: '22px', fontWeight: '700', color: '#FF6B35' },
  metricLabel:    { fontSize: '12px', fontWeight: '500', color: '#2C2C2A', marginTop: '2px' },
  metricSub:      { fontSize: '11px', color: '#9E9E9E' },
  card:           { background: '#fff', border: '1.5px solid #FFE0B2', borderRadius: '16px', padding: '20px', marginBottom: '16px' },
  sectionTitle:   { fontSize: '15px', fontWeight: '600', color: '#2C2C2A', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  daycareRow:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid #FFE0B2' },
  waitlistRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #FFE0B2' },
  daycareName:    { fontSize: '14px', fontWeight: '600', color: '#FF6B35', marginBottom: '3px' },
  daycareAddr:    { fontSize: '12px', color: '#6B7280', marginBottom: '6px' },
  tags:           { display: 'flex', gap: '5px', flexWrap: 'wrap' },
  tagOrange:      { fontSize: '11px', background: '#FFF3E0', color: '#E65100', padding: '2px 7px', borderRadius: '20px', border: '1px solid #FFCC80' },
  tagPurple:      { fontSize: '11px', background: '#EDE7F6', color: '#5C35CC', padding: '2px 7px', borderRadius: '20px', border: '1px solid #B39DDB' },
  price:          { fontSize: '13px', fontWeight: '600', color: '#2C2C2A' },
  progressWrap:   { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' },
  progressBar:    { height: '4px', background: '#FFE0B2', borderRadius: '2px', width: '120px' },
  progressFill:   { height: '4px', background: '#FF6B35', borderRadius: '2px' },
  positionText:   { fontSize: '12px', color: '#E65100', fontWeight: '500' },
  alertWarning:   { display: 'flex', gap: '8px', alignItems: 'flex-start', background: '#FFF3E0', border: '1px solid #FFCC80', borderRadius: '8px', padding: '10px 14px', marginBottom: '8px' },
  alertSuccess:   { display: 'flex', gap: '8px', alignItems: 'center', background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: '8px', padding: '10px 14px', marginBottom: '8px' },
  loadingText:    { fontSize: '14px', color: '#9E9E9E' },
  emptySection:   { textAlign: 'center', padding: '20px 0' },
  emptySectionText:{ fontSize: '14px', color: '#9E9E9E', marginBottom: '12px' },
  emptyCard:      { background: '#fff', borderRadius: '20px', border: '2px solid #FFE0B2', padding: '40px', textAlign: 'center', maxWidth: '440px', margin: '40px auto' },
  emptyIcon:      { fontSize: '48px', marginBottom: '12px' },
  emptyTitle:     { fontSize: '20px', fontWeight: '700', color: '#2C2C2A', marginBottom: '8px' },
  emptySub:       { fontSize: '14px', color: '#9E9E9E', marginBottom: '16px' },
  btnOrange:      { padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#FF6B35', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  btnLink:        { fontSize: '13px', color: '#FF6B35', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' },
  btnRemove:      { fontSize: '12px', color: '#C62828', background: '#FFEBEE', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' },
};