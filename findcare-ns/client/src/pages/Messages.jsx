import { useState, useEffect, useRef } from 'react';
import { useAuth }     from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function getId(value) {
  return typeof value === 'string' ? value : value?._id;
}

function groupMessages(messages) {
  const groups = new Map();
  messages.forEach(message => {
    const participants = [getId(message.from), getId(message.to)].sort();
    const daycareId = getId(message.daycare) || 'no-daycare';
    const key = `${daycareId}:${participants.join(':')}`;
    if (!groups.has(key)) {
      groups.set(key, { key, daycare: message.daycare, messages: [] });
    }
    groups.get(key).messages.push(message);
  });

  return Array.from(groups.values())
    .map(conversation => ({
      ...conversation,
      messages: conversation.messages.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      )
    }))
    .sort((a, b) => {
      const aLatest = a.messages[a.messages.length - 1];
      const bLatest = b.messages[b.messages.length - 1];
      return new Date(bLatest.createdAt) - new Date(aLatest.createdAt);
    });
}

export default function Messages() {
  const { user, token } = useAuth();
  const navigate        = useNavigate();
  const location        = useLocation();
  const [messages, setMessages] = useState([]);
  const [savedDaycares, setSavedDaycares] = useState([]);
  const [ownerDaycare, setOwnerDaycare] = useState(null);
  const [parentContacts, setParentContacts] = useState([]);
  const [composerError, setComposerError] = useState('');
  const [loading, setLoading] = useState(true);
  const [newMsg, setNewMsg] = useState({ daycareId: '', to: '', text: '' });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('');
  const [activeConversation, setActiveConversation] = useState('');
  const pendingReadIds = useRef(new Set());
  const userId = user?._id || user?.id;
  const conversations = groupMessages(messages);
  const selectedConversation = conversations.find(c => c.key === activeConversation) || conversations[0] || null;

  useEffect(() => {
    if (!user || !token) {
      setLoading(false);
      return;
    }

    let mounted = true;
    async function loadMessages() {
      try {
        const res = await fetch(`${API_URL}/api/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Unable to load messages');
        const data = await res.json();
        if (mounted) setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    async function loadComposerOptions() {
      try {
        if (user.role === 'owner') {
          const daycareRes = await fetch(`${API_URL}/api/daycares/my`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!daycareRes.ok) {
            if (mounted) setComposerError('Could not load your daycare. Please refresh and try again.');
            return;
          }
          const daycare = await daycareRes.json();
          const contactsRes = await fetch(
            `${API_URL}/api/messages/contacts?daycareId=${encodeURIComponent(daycare._id)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const contacts = await contactsRes.json();
          if (!contactsRes.ok) {
            if (mounted) {
              setComposerError(contacts.error || 'Saved-parent contacts are unavailable. Please restart or update the messaging server.');
            }
            return;
          }
          if (mounted) {
            setOwnerDaycare(daycare);
            setParentContacts(Array.isArray(contacts) ? contacts : []);
            setComposerError('');
          }
          return;
        }

        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const ids = data.savedDaycares || [];
        const details = await Promise.all(ids.map(id =>
          fetch(`${API_URL}/api/daycares/${getId(id)}`).then(response => response.json())
        ));
        if (mounted) setSavedDaycares(details.filter(daycare => daycare._id));
      } catch (err) {
        console.error(err);
      }
    }

    loadMessages();
    loadComposerOptions();
    const refreshTimer = window.setInterval(loadMessages, 15000);
    return () => {
      mounted = false;
      window.clearInterval(refreshTimer);
    };
  }, [user, token]);

  // Auto fill from URL params (when coming from daycare profile)
  useEffect(() => {
    const params    = new URLSearchParams(location.search);
    const daycareId = params.get('daycareId');
    const daycareName = params.get('daycareName');
    if (daycareId && user?.role !== 'owner') {
      setNewMsg(prev => ({
        ...prev,
        daycareId,
        text: daycareName ? `Hi, I am interested in ${daycareName}. ` : ''
      }));
    }
  }, [location, user]);

  useEffect(() => {
    if (!selectedConversation || !userId || !token) return;
    selectedConversation.messages
      .filter(message => getId(message.to) === userId && !message.read)
      .forEach(async message => {
        if (pendingReadIds.current.has(message._id)) return;
        pendingReadIds.current.add(message._id);
        try {
          const res = await fetch(`${API_URL}/api/messages/${message._id}/read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            setMessages(previous => previous.map(item =>
              item._id === message._id ? { ...item, read: true } : item
            ));
          }
        } catch (err) {
          console.error(err);
        } finally {
          pendingReadIds.current.delete(message._id);
        }
      });
  }, [selectedConversation, userId, token]);

  async function sendMessage() {
    const isOwner = user.role === 'owner';
    const daycareId = isOwner ? ownerDaycare?._id : newMsg.daycareId;
    const recipientId = isOwner
      ? newMsg.to
      : savedDaycares.find(daycare => daycare._id === newMsg.daycareId)?.owner;

    if (!daycareId || !recipientId || !newMsg.text.trim()) {
      setStatus({
        type: 'error',
        text: isOwner
          ? 'Select a parent and write a message.'
          : 'Select a daycare and write a message.'
      });
      return;
    }

    setSending(true);
    setStatus(null);
    try {
      const res = await fetch(`${API_URL}/api/messages`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          to: recipientId,
          daycareId,
          text:     newMsg.text
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: 'error', text: data.error || 'Message could not be sent.' });
      } else {
        setMessages(prev => [data, ...prev]);
        setNewMsg({ daycareId: '', to: '', text: '' });
        setStatus({ type: 'success', text: 'Message sent to the daycare owner.' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: 'Message could not be sent. Please try again.' });
    } finally {
      setSending(false);
    }
  }

  async function sendReply() {
    if (!selectedConversation || !replyText.trim()) {
      setReplyStatus('Write a reply before sending.');
      return;
    }

    const lastMessage = selectedConversation.messages[selectedConversation.messages.length - 1];
    const isLastMessageMine = getId(lastMessage.from) === userId;
    setSending(true);
    setReplyStatus('');
    try {
      const res = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          replyTo: lastMessage._id,
          to: isLastMessageMine ? getId(lastMessage.to) : getId(lastMessage.from),
          daycareId: getId(lastMessage.daycare),
          text: replyText
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setReplyStatus(data.error || 'Reply could not be sent.');
      } else {
        setMessages(previous => [data, ...previous]);
        setReplyText('');
      }
    } catch (err) {
      setReplyStatus('Reply could not be sent. Please try again.');
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

  const latestMessage = selectedConversation?.messages[selectedConversation.messages.length - 1];
  const threadContact = latestMessage
    ? (getId(latestMessage.from) === userId ? latestMessage.to : latestMessage.from)
    : null;

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
          <label style={styles.label}>
            {user.role === 'owner' ? 'Select a parent who has saved your daycare' : 'Select a daycare'}
          </label>
          {user.role === 'owner' ? composerError ? (
            <div style={styles.errorMsg}>{composerError}</div>
          ) : (
            parentContacts.length === 0 ? (
              <div style={styles.noSaved}>
                <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '10px' }}>
                  {ownerDaycare
                    ? 'No parents have saved your daycare yet.'
                    : 'Register your daycare before messaging parents.'}
                </p>
              </div>
            ) : (
              <select
                value={newMsg.to}
                onChange={event => setNewMsg({ ...newMsg, to: event.target.value })}
                style={styles.input}
              >
                <option value="">Choose a parent...</option>
                {parentContacts.map(parent => (
                  <option key={parent._id} value={parent._id}>{parent.name}</option>
                ))}
              </select>
            )
          ) : savedDaycares.length === 0 ? (
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
            maxLength={2000}
            placeholder="Write your message to the daycare owner..."
            value={newMsg.text}
            onChange={e => setNewMsg({ ...newMsg, text: e.target.value })}
            style={{ ...styles.input, height: '100px', resize: 'none' }}
          />
        </div>

        {user.role === 'owner' && ownerDaycare && (
          <p style={styles.composerContext}>Sending as {ownerDaycare.name}</p>
        )}

        {status && (
          <div style={status.type === 'success' ? styles.successMsg : styles.errorMsg}>
            {status.text}
          </div>
        )}

        <button
          onClick={sendMessage}
          disabled={sending || (user.role === 'owner'
            ? !ownerDaycare || parentContacts.length === 0
            : savedDaycares.length === 0)}
          style={{
            ...styles.btnGreen,
            opacity: (user.role === 'owner'
              ? !ownerDaycare || parentContacts.length === 0
              : savedDaycares.length === 0) ? 0.5 : 1
          }}
        >
          {sending ? 'Sending...' : 'Send message'}
        </button>
      </div>

      {/* Conversations */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Conversations ({conversations.length})</h2>
        {loading && <p style={{ fontSize: '14px', color: '#6B7280' }}>Loading...</p>}
        {!loading && conversations.length === 0 && (
          <p style={{ fontSize: '14px', color: '#6B7280' }}>No messages yet.</p>
        )}
        {conversations.map(conversation => {
          const lastMessage = conversation.messages[conversation.messages.length - 1];
          const isMine = getId(lastMessage.from) === userId;
          const otherUser = isMine ? lastMessage.to : lastMessage.from;
          const unreadCount = conversation.messages.filter(message =>
            getId(message.to) === userId && !message.read
          ).length;
          return (
            <button
              key={conversation.key}
              type="button"
              onClick={() => {
                setActiveConversation(conversation.key);
                setReplyStatus('');
              }}
              style={{
                ...styles.conversationButton,
                ...(selectedConversation?.key === conversation.key ? styles.selectedConversation : {})
              }}
            >
              <span style={styles.conversationMain}>
                <strong>{otherUser?.name || 'Conversation'}</strong>
                <span style={styles.conversationPreview}>{lastMessage.text}</span>
              </span>
              <span style={styles.conversationMeta}>
                <span>{conversation.daycare?.name || 'Daycare'}</span>
                <span>{timeAgo(lastMessage.createdAt)}</span>
                {unreadCount > 0 && <span style={styles.newBadge}>{unreadCount} new</span>}
              </span>
            </button>
          );
        })}
      </div>

      {selectedConversation && latestMessage && (
        <div style={styles.card}>
          <div style={styles.threadHeading}>
            <div>
              <h2 style={styles.cardTitle}>{selectedConversation.daycare?.name || 'Conversation'}</h2>
              <p style={styles.threadContact}>With {threadContact?.name || 'user'}</p>
            </div>
          </div>

          <div style={styles.threadMessages}>
            {selectedConversation.messages.map(message => {
              const isMine = getId(message.from) === userId;
              return (
                <div key={message._id} style={{
                  ...styles.threadMessage,
                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                  background: isMine ? '#E1F5EE' : '#F3F4F6'
                }}>
                  <span style={styles.threadSender}>{isMine ? 'You' : message.from?.name}</span>
                  <p style={styles.msgText}>{message.text}</p>
                  <span style={styles.threadTime}>
                    {timeAgo(message.createdAt)}{isMine && message.read ? ' · Read' : ''}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={styles.replyBox}>
            <label style={styles.label} htmlFor="message-reply">Reply</label>
            <textarea
              id="message-reply"
              maxLength={2000}
              placeholder={`Reply to ${threadContact?.name || 'this conversation'}...`}
              value={replyText}
              onChange={event => setReplyText(event.target.value)}
              style={{ ...styles.input, height: '90px', resize: 'vertical' }}
            />
            <div style={styles.replyFooter}>
              <span style={styles.characterCount}>{replyText.length}/2000</span>
              <button
                type="button"
                onClick={sendReply}
                disabled={sending || !replyText.trim()}
                style={{ ...styles.btnGreen, opacity: sending || !replyText.trim() ? 0.55 : 1 }}
              >
                {sending ? 'Sending...' : 'Send reply'}
              </button>
            </div>
            {replyStatus && <div style={styles.errorMsg}>{replyStatus}</div>}
          </div>
        </div>
      )}

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
  conversationButton: { width: '100%', display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center', padding: '12px', marginBottom: '8px', textAlign: 'left', border: '1px solid #E8E6E0', borderRadius: '8px', background: '#fff', color: '#2C2C2A', cursor: 'pointer', fontFamily: 'inherit' },
  selectedConversation: { borderColor: '#1D9E75', background: '#F0FBF7' },
  conversationMain: { minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' },
  conversationPreview: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '380px', fontSize: '12px', color: '#6B7280' },
  conversationMeta: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0, fontSize: '11px', color: '#6B7280' },
  threadHeading: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E8E6E0', marginBottom: '16px' },
  threadContact: { marginTop: '-10px', marginBottom: '14px', fontSize: '12px', color: '#6B7280' },
  threadMessages: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto', padding: '4px 0 16px' },
  threadMessage: { width: 'fit-content', maxWidth: '85%', padding: '10px 12px', borderRadius: '8px' },
  threadSender: { display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '600', color: '#374151' },
  threadTime: { display: 'block', marginTop: '6px', fontSize: '10px', color: '#6B7280', textAlign: 'right' },
  replyBox: { borderTop: '1px solid #E8E6E0', paddingTop: '14px' },
  replyFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' },
  characterCount: { fontSize: '11px', color: '#6B7280' },
  emptyCard:   { background: '#fff', borderRadius: '12px', border: '1px solid #E8E6E0', padding: '40px', textAlign: 'center', maxWidth: '440px', margin: '40px auto' },
};