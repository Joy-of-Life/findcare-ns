import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BrandIcon from '../components/BrandIcon';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function VerifyEmail() {
  const [status, setStatus]   = useState('verifying');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [searchParams]        = useSearchParams();
  const navigate              = useNavigate();
  const token                 = searchParams.get('token');

  const verifyEmail = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    if (token) verifyEmail();
    else { setStatus('error'); setMessage('No verification token was found. Request a new link below.'); }
  }, [token, verifyEmail]);

  async function resendVerification(e) {
    e.preventDefault();
    setResending(true);
    setResendMessage('');
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to request a verification link.');
      setResendMessage(data.message || 'If an unverified account exists for this email, a new verification link will be sent.');
    } catch (err) {
      setResendMessage(err.message || 'Unable to request a verification link. Please try again.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <BrandIcon size={32} />
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
            <p style={styles.sub}>Thanks for confirming. You can now log in to your FindCare account.</p>
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
            <form onSubmit={resendVerification} style={styles.resendForm}>
              <label htmlFor="verification-email" style={styles.emailLabel}>Email address</label>
              <input
                id="verification-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                style={styles.emailInput}
              />
              <button type="submit" disabled={resending} style={styles.btn}>
                {resending ? 'Requesting link...' : 'Resend verification link'}
              </button>
              {resendMessage && <p role="status" style={styles.resendMessage}>{resendMessage}</p>}
            </form>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
              <button onClick={() => navigate('/register')} style={styles.btn}>Create an account</button>
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
  resendForm:  { margin: '18px 0', textAlign: 'left' },
  emailLabel:  { display: 'block', fontSize: '13px', color: '#555', marginBottom: '6px' },
  emailInput:  { boxSizing: 'border-box', width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #FFCC80', fontSize: '14px', marginBottom: '10px' },
  resendMessage: { fontSize: '13px', color: '#6B7280', lineHeight: '1.5', textAlign: 'center' },
};