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

  async function leaveWaitlist(daycareId, ageGroup) {
    try {
      await fetch(`${API_URL}/api/waitlist/${daycareId}`, {
        method:  'DELETE',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ageGroup })
      });
      setWaitlist(prev => prev.filter(
        w => !(w.daycare._id === daycareId && w.ageGroup === ageGroup)
      ));
    } catch (err) {
      console.error(err);
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
          body: JSON.stringify({ ageGroups: ['infant', 'toddler', 'preschool'] })
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
          <button onClick={() => navigate('/login')} style={styles.btnGreen}>Log in</button>
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
            <div style={styles.userSub}>Parent account · Nova Scotia</div>
          </div>
        </div>
        <button onClick={() => navigate('/')} style={styles.btnGreen}>
          🔍 Find daycares
        </button>
      </div>

      {/* Metric cards */}
      <div style={styles.metrics}>
        {[
          { icon: '❤️', label: 'Saved',     value: savedDaycares.length,              sub: 'daycares'     },
          { icon: '📋', label: 'Waitlists', value: waitlist.length,                   sub: 'active'       },
          { icon: '🔔', label: 'Alerts',    value: alertsOn ? 'On' : 'Off',           sub: 'email alerts' },
          { icon: '💬', label: 'Messages',  value: 0,                                 sub: 'unread'       },
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
          <button onClick={() => navigate('/')} style={styles.btnLink}>Find more →</button>
        </div>
        {loading && <p style={{ fontSize: '14px', color: '#6B7280' }}>Loading...</p>}
        {!loading && savedDaycares.length === 0 && (
          <div style={styles.empty}>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>
              No saved daycares yet. Search and click ♡ Save to add them here.
            </p>
            <button onClick={() => navigate('/')} style={styles.btnGreen}>Search daycares</button>
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
                <div style={styles.daycareAddr}>📍 {daycare.address}, {daycare.city}</div>
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
                <button onClick={() => unsaveDaycare(daycare._id)} style={styles.btnRemove}>
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Waitlist tracker */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>
          <span>Waitlist tracker</span>
          <button onClick={() => navigate('/')} style={styles.btnLink}>Find daycares →</button>
        </div>
        {waitlist.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            Not on any waitlists yet. Visit a daycare profile to join a waitlist.
          </p>
        ) : (
          waitlist.map(entry => {
            const total = entry.position;
            return (
              <div key={entry._id} style={styles.waitlistRow}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ ...styles.daycareName, cursor: 'pointer', color: '#1D9E75' }}
                    onClick={() => navigate(`/daycare/${entry.daycare._id}`)}
                  >
                    {entry.daycare?.name}
                  </div>
                  <div style={styles.daycareAddr}>
                    📍 {entry.daycare?.city} · {entry.ageGroup}
                  </div>
                  <div style={styles.progressWrap}>
                    <div style={styles.progressBar}>
                      <div style={{
                        ...styles.progressFill,
                        width: `${Math.min(100, (1 / total) * 100)}%`
                      }}/>
                    </div>
                    <span style={styles.positionText}>Position #{entry.position}</span>
                  </div>
                </div>
                <button
                  onClick={() => leaveWaitlist(entry.daycare._id, entry.ageGroup)}
                  style={styles.btnRemove}
                >
                  Leave
                </button>
              </div>
            );
          })
        )}
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

  {/* Helper message — shows when alerts on but no saved daycares */}
  {alertsOn && savedDaycares.length === 0 && (
    <div style={{
      background:   '#FAEEDA',
      border:       '1px solid #FAC775',
      borderRadius: '8px',
      padding:      '10px 14px',
      marginBottom: '14px',
      display:      'flex',
      alignItems:   'flex-start',
      gap:          '8px',
    }}>
      <span style={{ fontSize: '16px', flexShrink: 0 }}>💡</span>
      <p style={{ fontSize: '13px', color: '#633806', margin: 0, lineHeight: '1.5' }}>
        Alerts are on but you haven't saved any daycares yet.
        You'll only receive alerts for daycares you save.{' '}
        <span
          onClick={() => navigate('/')}
          style={{ color: '#854F0B', fontWeight: '500', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Find and save daycares →
        </span>
      </p>
    </div>
  )}

  {/* Helper message — shows when alerts on and has saved daycares */}
  {alertsOn && savedDaycares.length > 0 && (
    <div style={{
      background:   '#E1F5EE',
      border:       '1px solid #5DCAA5',
      borderRadius: '8px',
      padding:      '10px 14px',
      marginBottom: '14px',
      display:      'flex',
      alignItems:   'center',
      gap:          '8px',
    }}>
      <span style={{ fontSize: '16px' }}>✅</span>
      <p style={{ fontSize: '13px', color: '#085041', margin: 0 }}>
        You'll receive email alerts when spots open at your {savedDaycares.length} saved daycare{savedDaycares.length !== 1 ? 's' : ''}.
      </p>
    </div>
  )}

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
  page:         { maxWidth: '720px', margin: '0 auto', padding: '32px 16px', background: '#F8F7F4', minHeight: '100vh' },
  topbar:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #E8E6E0' },
  avatar:       { width: '40px', height: '40px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '500', color: '#085041' },
  userName:     { fontSize: '15px', fontWeight: '500', color: '#2C2C2A' },
  userSub:      { fontSize: '12px', color: '#6B7280' },
  metrics:      { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px', marginBottom: '24px' },
  metric:       { background: '#fff', borderRadius: '10px', padding: '14px', border: '1px solid #E8E6E0' },
  metricLabel:  { fontSize: '12px', color: '#6B7280', marginBottom: '4px' },
  metricValue:  { fontSize: '22px', fontWeight: '500', color: '#2C2C2A' },
  metricSub:    { fontSize: '11px', color: '#6B7280', marginTop: '2px' },
  card:         { background: '#fff', border: '1px solid #E8E6E0', borderRadius: '12px', padding: '20px', marginBottom: '16px' },
  sectionTitle: { fontSize: '15px', fontWeight: '500', color: '#2C2C2A', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  daycareRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid #F3F4F6' },
  waitlistRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F3F4F6' },
  daycareName:  { fontSize: '14px', fontWeight: '500', color: '#2C2C2A', marginBottom: '3px' },
  daycareAddr:  { fontSize: '12px', color: '#6B7280', marginBottom: '6px' },
  tags:         { display: 'flex', gap: '5px', flexWrap: 'wrap' },
  tagGreen:     { fontSize: '11px', background: '#E1F5EE', color: '#085041', padding: '2px 7px', borderRadius: '20px' },
  tagPurple:    { fontSize: '11px', background: '#EEEDFE', color: '#534AB7', padding: '2px 7px', borderRadius: '20px' },
  progressWrap: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' },
  progressBar:  { height: '4px', background: '#E8E6E0', borderRadius: '2px', width: '120px' },
  progressFill: { height: '4px', background: '#1D9E75', borderRadius: '2px' },
  positionText: { fontSize: '12px', color: '#6B7280' },
  empty:        { textAlign: 'center', padding: '24px 0' },
  emptyCard:    { background: '#fff', borderRadius: '12px', border: '1px solid #E8E6E0', padding: '40px', textAlign: 'center', maxWidth: '440px', margin: '40px auto' },
  btnGreen:     { padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#1D9E75', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
  btnLink:      { fontSize: '13px', color: '#1D9E75', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '400' },
  btnRemove:    { fontSize: '12px', color: '#A32D2D', background: '#FCEBEB', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' },
};