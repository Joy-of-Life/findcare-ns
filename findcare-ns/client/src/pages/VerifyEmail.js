import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function VerifyEmail() {
  const [status, setStatus]   = useState('verifying');
  const [message, setMessage] = useState('');
  const [searchParams]        = useSearchParams();
  const navigate              = useNavigate();
  const token                 = searchParams.get('token');

  useEffect(() => {
    if (token) verifyEmail();
    else { setStatus('error'); setMessage('Invalid verification link — no token found.'); }
  }, [token]);

  async function verifyEmail() {
    try {
      const res  = await fetch(`${API_URL}/api/auth/verify-email`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token })
      });
      const data = await res.json();
      if (res.ok) { setStatus('success'); setMessage(data.message || 'Email verified!'); }
      else        { setStatus('error');   setMessage(data.error  || 'Verification failed.'); }
    } catch (err) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <span style={styles.logoIcon}>🏠</span>
          <span style={styles.logoText}>FindCare</span>
        </div>
        <div style={styles.logoSub}>Nova Scotia</div>

        {status === 'verifying' && (
          <>
            <div style={styles.iconWrap}><div style={styles.spinner} /></div>
            <h1 style={styles.title}>Verifying your email...</h1>
            <p style={styles.sub}>Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={styles.iconWrap}>
              <div style={styles.iconSuccess}>✓</div>
            </div>
            <h1 style={styles.title}>Email verified! 🎉</h1>
            <p style={styles.sub}>{message}</p>
            <p style={styles.sub}>You can now log in to your FindCare account.</p>
            <button onClick={() => navigate('/login')} style={styles.btn}>
              🔓 Log in to FindCare
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={styles.iconWrap}>
              <div style={styles.iconError}>✕</div>
            </div>
            <h1 style={styles.title}>Verification failed</h1>
            <p style={styles.sub}>{message}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
              <button onClick={() => navigate('/register')} style={styles.btn}>Register again</button>
              <button onClick={() => navigate('/')}         style={styles.btnGray}>Go home</button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const styles = {
  page:        { minHeight: '100vh', background: '#FFFDF9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' },
  card:        { background: '#fff', borderRadius: '20px', border: '2px solid #FFE0B2', padding: '40px 32px', width: '100%', maxWidth: '420px', textAlign: 'center' },
  logoWrap:    { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' },
  logoIcon:    { fontSize: '28px' },
  logoText:    { fontSize: '28px', fontWeight: '700', color: '#FF6B35' },
  logoSub:     { fontSize: '12px', color: '#9E9E9E', background: '#FFF3E0', padding: '2px 10px', borderRadius: '20px', border: '1px solid #FFCC80', display: 'inline-block', marginBottom: '20px' },
  iconWrap:    { display: 'flex', justifyContent: 'center', marginBottom: '20px' },
  spinner:     { width: '48px', height: '48px', border: '4px solid #FFE0B2', borderTopColor: '#FF6B35', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  iconSuccess: { width: '52px', height: '52px', borderRadius: '50%', background: '#FFF3E0', color: '#FF6B35', fontSize: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', border: '2px solid #FFCC80' },
  iconError:   { width: '52px', height: '52px', borderRadius: '50%', background: '#FFEBEE', color: '#C62828', fontSize: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', border: '2px solid #EF9A9A' },
  title:       { fontSize: '22px', fontWeight: '700', color: '#2C2C2A', marginBottom: '8px' },
  sub:         { fontSize: '14px', color: '#6B7280', marginBottom: '12px', lineHeight: '1.6' },
  btn:         { padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#FF6B35', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  btnGray:     { padding: '10px 24px', borderRadius: '10px', border: '1.5px solid #FFCC80', background: '#fff', color: '#555', fontSize: '14px', cursor: 'pointer' },
};