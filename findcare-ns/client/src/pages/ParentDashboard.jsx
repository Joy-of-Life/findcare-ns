import { useState, useEffect } from 'react';
import { useAuth }     from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function ParentDashboard() {
  const { user, token } = useAuth();
  const navigate        = useNavigate();
  const [savedDaycares, setSavedDaycares] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [alertsOn, setAlertsOn]           = useState(false);

  useEffect(() => {
    if (user) fetchSavedDaycares();
  }, [user]);

  async function fetchSavedDaycares() {
    try {
      const res  = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.alertPrefs?.email) setAlertsOn(true);

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

  async function unsaveDaycare(daycareId) {
    try {
      await fetch(`${API_URL}/api/auth/save-daycare`, {
        method:  'PATCH',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ daycareId })
      });
      setSavedDaycares(prev => prev.filter(d => d._id !== daycareId));
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleAlerts() {
  try {
    if (alertsOn) {
      const res = await fetch(`${API_URL}/api/alerts/unsubscribe`, {
        method:  'PATCH',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) setAlertsOn(false);
    } else {
      const res = await fetch(`${API_URL}/api/alerts/subscribe`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ageGroups: ['infant', 'toddler', 'preschool']
        })
      });
      if (res.ok) setAlertsOn(true);
    }
  } catch (err) {
    console.error(err);
  }
}

  function getAvailabilityStatus(daycare) {
    const total = (daycare.availability?.infant    || 0) +
                  (daycare.availability?.toddler   || 0) +
                  (daycare.availability?.preschool || 0);
    if (total > 0) return { text: `${total} spots open`, bg: '#E1F5EE', color: '#085041' };
    return { text: 'Waitlist only', bg: '#FAEEDA', color: '#854F0B' };
  }

  if (!user) {
    return (
      <div style={styles.page}>
        <div style={styles.emptyCard}>
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
            Parent dashboard
          </h2>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
            Log in to access your dashboard.
          </p>
          <button onClick={() => navigate('/login')} style={styles.btnGreen}>
            Log in
          </button>
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
            <div style={styles.userName}>{user.name}</div>
            <div style={styles.userSub}>Parent account · Halifax, NS</div>
          </div>
        </div>
        <button onClick={() => navigate('/')} style={styles.btnGreen}>
          🔍 Find daycares
        </button>
      </div>

      {/* Metric cards */}
      <div style={styles.metrics}>
        {[
          { icon: '❤️', label: 'Saved',     value: savedDaycares.length, sub: 'daycares' },
          { icon: '📋', label: 'Waitlists', value: 0,                    sub: 'active'   },
          { icon: '🔔', label: 'Alerts',    value: alertsOn ? 'On' : 'Off', sub: 'email alerts' },
          { icon: '💬', label: 'Messages',  value: 0,                    sub: 'unread'   },
        ].map(m => (
          <div key={m.label} style={styles.metric}>
            <div style={styles.metricLabel}>{m.icon} {m.label}</div>
            <div style={styles.metricValue}>{m.value}</div>
            <div style={styles.metricSub}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Saved daycares */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>
          <span>Saved daycares</span>
          <button onClick={() => navigate('/')} style={styles.btnLink}>
            Find more →
          </button>
        </div>

        {loading && (
          <p style={{ fontSize: '14px', color: '#6B7280' }}>Loading...</p>
        )}

        {!loading && savedDaycares.length === 0 && (
          <div style={styles.empty}>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>
              No saved daycares yet. Search for daycares and click the heart icon to save them here.
            </p>
            <button onClick={() => navigate('/')} style={styles.btnGreen}>
              Search daycares
            </button>
          </div>
        )}

        {savedDaycares.map(daycare => {
          const status = getAvailabilityStatus(daycare);
          return (
            <div key={daycare._id} style={styles.daycareRow}>
              <div style={{ flex: 1 }}>
                <div
                  style={{ ...styles.daycareName, cursor: 'pointer', color: '#1D9E75' }}
                  onClick={() => navigate(`/daycare/${daycare._id}`)}
                >
                  {daycare.name}
                </div>
                <div style={styles.daycareAddr}>
                  📍 {daycare.address}, {daycare.city}
                </div>
                <div style={styles.tags}>
                  {daycare.ageRange?.map(age => (
                    <span key={age} style={styles.tagGreen}>{age}</span>
                  ))}
                  {daycare.language?.map(lang => (
                    <span key={lang} style={styles.tagPurple}>{lang}</span>
                  ))}
                  <span style={{ ...styles.tagGreen, background: status.bg, color: status.color }}>
                    {status.text}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#2C2C2A' }}>
                  ${daycare.monthlyPrice}/mo
                </span>
                <button
                  onClick={() => unsaveDaycare(daycare._id)}
                  style={styles.btnRemove}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Waitlist tracker */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>Waitlist tracker</div>
        <p style={{ fontSize: '14px', color: '#6B7280' }}>
          Join a waitlist from any daycare profile to track your position here.
        </p>
      </div>

      {/* Spot alerts */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>
          <span>Spot alerts</span>
          <span style={{
            fontSize:     '12px',
            background:   alertsOn ? '#E1F5EE' : '#F8F7F4',
            color:        alertsOn ? '#085041' : '#6B7280',
            padding:      '3px 10px',
            borderRadius: '20px',
            border:       '1px solid #E8E6E0'
          }}>
            {alertsOn ? '🔔 Alerts on' : '🔕 Alerts off'}
          </span>
        </div>
        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '14px' }}>
          Get an email when a spot opens at any of your saved daycares.
        </p>
        <button
          onClick={toggleAlerts}
          style={{
            padding:      '8px 16px',
            borderRadius: '8px',
            border:       'none',
            background:   alertsOn ? '#FCEBEB' : '#1D9E75',
            color:        alertsOn ? '#A32D2D' : '#fff',
            fontSize:     '13px',
            cursor:       'pointer',
            fontWeight:   '500'
          }}
        >
          {alertsOn ? 'Turn off alerts' : 'Turn on alerts'}
        </button>
      </div>

      {/* Messages */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>Messages</div>
        <p style={{ fontSize: '14px', color: '#6B7280' }}>
          Messages from daycare owners will appear here.
        </p>
      </div>

    </div>
  );
}

const styles = {
  page:        { maxWidth: '720px', margin: '0 auto', padding: '32px 16px', background: '#F8F7F4', minHeight: '100vh' },
  topbar:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #E8E6E0' },
  avatar:      { width: '40px', height: '40px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '500', color: '#085041' },
  userName:    { fontSize: '15px', fontWeight: '500', color: '#2C2C2A' },
  userSub:     { fontSize: '12px', color: '#6B7280' },
  metrics:     { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px', marginBottom: '24px' },
  metric:      { background: '#fff', borderRadius: '10px', padding: '14px', border: '1px solid #E8E6E0' },
  metricLabel: { fontSize: '12px', color: '#6B7280', marginBottom: '4px' },
  metricValue: { fontSize: '22px', fontWeight: '500', color: '#2C2C2A' },
  metricSub:   { fontSize: '11px', color: '#6B7280', marginTop: '2px' },
  card:        { background: '#fff', border: '1px solid #E8E6E0', borderRadius: '12px', padding: '20px', marginBottom: '16px' },
  sectionTitle:{ fontSize: '15px', fontWeight: '500', color: '#2C2C2A', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  daycareRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid #F3F4F6' },
  daycareName: { fontSize: '14px', fontWeight: '500', color: '#2C2C2A', marginBottom: '3px' },
  daycareAddr: { fontSize: '12px', color: '#6B7280', marginBottom: '6px' },
  tags:        { display: 'flex', gap: '5px', flexWrap: 'wrap' },
  tagGreen:    { fontSize: '11px', background: '#E1F5EE', color: '#085041', padding: '2px 7px', borderRadius: '20px' },
  tagPurple:   { fontSize: '11px', background: '#EEEDFE', color: '#534AB7', padding: '2px 7px', borderRadius: '20px' },
  empty:       { textAlign: 'center', padding: '24px 0' },
  emptyCard:   { background: '#fff', borderRadius: '12px', border: '1px solid #E8E6E0', padding: '40px', textAlign: 'center', maxWidth: '440px', margin: '40px auto' },
  btnGreen:    { padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#1D9E75', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
  btnLink:     { fontSize: '13px', color: '#1D9E75', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '400' },
  btnRemove:   { fontSize: '12px', color: '#A32D2D', background: '#FCEBEB', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' },
};