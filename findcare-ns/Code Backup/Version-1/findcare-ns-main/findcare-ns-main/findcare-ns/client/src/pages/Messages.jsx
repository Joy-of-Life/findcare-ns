import { useState, useEffect } from 'react';
import { useAuth }     from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Messages() {
  const { user, token } = useAuth();
  const navigate        = useNavigate();
  const location        = useLocation();
  const [messages, setMessages]       = useState([]);
  const [savedDaycares, setSavedDaycares] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [newMsg, setNewMsg]           = useState({ daycareId: '', text: '' });
  const [sending, setSending]         = useState(false);
  const [status, setStatus]           = useState('');

  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchSavedDaycares();
    }
  }, [user]);

  // Auto fill from URL params (when coming from daycare profile)
  useEffect(() => {
    const params    = new URLSearchParams(location.search);
    const daycareId = params.get('daycareId');
    const daycareName = params.get('daycareName');
    if (daycareId) {
      setNewMsg(prev => ({
        ...prev,
        daycareId,
        text: daycareName ? `Hi, I am interested in ${daycareName}. ` : ''
      }));
    }
  }, [location]);

  async function fetchMessages() {
    try {
      const res  = await fetch(`${API_URL}/api/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSavedDaycares() {
    try {
      const res  = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
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
    }
  }

  async function sendMessage() {
    if (!newMsg.daycareId || !newMsg.text) {
      setStatus('error');
      return;
    }

    // Get the owner ID from the selected daycare
    const daycare = savedDaycares.find(d => d._id === newMsg.daycareId);
    if (!daycare) {
      setStatus('error');
      return;
    }

    setSending(true);
    setStatus('');
    try {
      const res = await fetch(`${API_URL}/api/messages`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          to:       daycare.owner,
          daycareId: newMsg.daycareId,
          text:     newMsg.text
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
      } else {
        setMessages(prev => [data, ...prev]);
        setNewMsg({ daycareId: '', text: '' });
        setStatus('success');
      }
    } catch (err) {
      setStatus('error');
    } finally {
      setSending(false);
    }
  }

  function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60)    return 'just now';
    if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  if (!user) {
    return (
      <div style={styles.page}>
        <div style={styles.emptyCard}>
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>Messages</h2>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
            Log in to view your messages.
          </p>
          <button onClick={() => navigate('/login')} style={styles.btnGreen}>Log in</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
      <h1 style={styles.title}>Messages</h1>

      {/* New message form */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>New message</h2>

        <div style={styles.field}>
          <label style={styles.label}>Select a daycare</label>
          {savedDaycares.length === 0 ? (
            <div style={styles.noSaved}>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '10px' }}>
                You haven't saved any daycares yet. Save daycares from search results to message their owners.
              </p>
              <button onClick={() => navigate('/')} style={styles.btnGreen}>
                Find daycares
              </button>
            </div>
          ) : (
            <select
              value={newMsg.daycareId}
              onChange={e => setNewMsg({ ...newMsg, daycareId: e.target.value })}
              style={styles.input}
            >
              <option value="">Choose a saved daycare...</option>
              {savedDaycares.map(d => (
                <option key={d._id} value={d._id}>
                  {d.name} — {d.city}
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Message</label>
          <textarea
            placeholder="Write your message to the daycare owner..."
            value={newMsg.text}
            onChange={e => setNewMsg({ ...newMsg, text: e.target.value })}
            style={{ ...styles.input, height: '100px', resize: 'none' }}
          />
        </div>

        {status === 'success' && (
          <div style={styles.successMsg}>✅ Message sent to the daycare owner!</div>
        )}
        {status === 'error' && (
          <div style={styles.errorMsg}>Please select a daycare and write a message.</div>
        )}

        <button
          onClick={sendMessage}
          disabled={sending || savedDaycares.length === 0}
          style={{
            ...styles.btnGreen,
            opacity: savedDaycares.length === 0 ? 0.5 : 1
          }}
        >
          {sending ? 'Sending...' : 'Send message'}
        </button>
      </div>

      {/* Message list */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Inbox ({messages.length})</h2>
        {loading && <p style={{ fontSize: '14px', color: '#6B7280' }}>Loading...</p>}
        {!loading && messages.length === 0 && (
          <p style={{ fontSize: '14px', color: '#6B7280' }}>No messages yet.</p>
        )}
        {messages.map(msg => {
          const isMine    = msg.from?._id === user.id || msg.from?.name === user.name;
          const otherUser = isMine ? msg.to : msg.from;
          const initials  = otherUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
          return (
            <div key={msg._id} style={{
              ...styles.msgRow,
              background: !msg.read && !isMine ? '#F0FBF7' : '#fff',
            }}>
              <div style={{
                ...styles.avatar,
                background: isMine ? '#EEEDFE' : '#E1F5EE',
                color:      isMine ? '#534AB7' : '#085041',
              }}>
                {initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={styles.msgHeader}>
                  <span style={styles.msgName}>
                    {isMine ? `To: ${otherUser?.name}` : `From: ${otherUser?.name}`}
                  </span>
                  {msg.daycare && (
                    <span style={styles.daycareBadge}>re: {msg.daycare?.name}</span>
                  )}
                  <span style={styles.msgTime}>{timeAgo(msg.createdAt)}</span>
                </div>
                <p style={styles.msgText}>{msg.text}</p>
                {!msg.read && !isMine && (
                  <span style={styles.newBadge}>New</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

const styles = {
  page:        { maxWidth: '720px', margin: '0 auto', padding: '24px 16px', background: '#F8F7F4', minHeight: '100vh' },
  backBtn:     { fontSize: '13px', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', padding: '0' },
  title:       { fontSize: '24px', fontWeight: '500', color: '#2C2C2A', marginBottom: '20px' },
  card:        { background: '#fff', border: '1px solid #E8E6E0', borderRadius: '12px', padding: '20px', marginBottom: '16px' },
  cardTitle:   { fontSize: '15px', fontWeight: '500', color: '#2C2C2A', marginBottom: '14px' },
  field:       { marginBottom: '12px' },
  label:       { fontSize: '13px', color: '#374151', display: 'block', marginBottom: '6px', fontWeight: '500' },
  input:       { width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E8E6E0', fontSize: '13px', color: '#2C2C2A', background: '#F8F7F4', fontFamily: 'inherit' },
  successMsg:  { background: '#E1F5EE', color: '#085041', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' },
  errorMsg:    { background: '#FCEBEB', color: '#A32D2D', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' },
  btnGreen:    { padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#1D9E75', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
  noSaved:     { background: '#F8F7F4', borderRadius: '8px', padding: '14px', border: '1px solid #E8E6E0' },
  msgRow:      { display: 'flex', gap: '12px', padding: '12px', borderRadius: '8px', marginBottom: '8px', border: '1px solid #F3F4F6' },
  avatar:      { width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '500', flexShrink: 0 },
  msgHeader:   { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' },
  msgName:     { fontSize: '13px', fontWeight: '500', color: '#2C2C2A' },
  daycareBadge:{ fontSize: '11px', background: '#EEEDFE', color: '#534AB7', padding: '2px 7px', borderRadius: '20px' },
  msgTime:     { fontSize: '11px', color: '#6B7280', marginLeft: 'auto' },
  msgText:     { fontSize: '13px', color: '#374151', lineHeight: '1.6' },
  newBadge:    { fontSize: '10px', background: '#E1F5EE', color: '#085041', padding: '2px 7px', borderRadius: '20px', marginTop: '4px', display: 'inline-block' },
  emptyCard:   { background: '#fff', borderRadius: '12px', border: '1px solid #E8E6E0', padding: '40px', textAlign: 'center', maxWidth: '440px', margin: '40px auto' },
};