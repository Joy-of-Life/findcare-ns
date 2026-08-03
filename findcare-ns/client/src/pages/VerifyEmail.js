import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function VerifyEmail() {
  const [status, setStatus]         = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage]       = useState('');
  const [searchParams]              = useSearchParams();
  const navigate                    = useNavigate();
  const token                       = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('Invalid verification link — no token found.');
    }
  }, [token]);

  async function verifyEmail() {
    try {
      const res  = await fetch(`${API_URL}/api/auth/verify-email`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
      } else {
        setStatus('error');
        setMessage(data.error || 'Verification failed. Link may have expired.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Logo */}
        <div style={styles.logo}>FindCare</div>
        <div style={styles.logoSub}>Nova Scotia</div>

        {/* Verifying state */}
        {status === 'verifying' && (
          <>
            <div style={styles.iconWrap}>
              <div style={styles.spinner} />
            </div>
            <h1 style={styles.title}>Verifying your email...</h1>
            <p style={styles.sub}>Please wait a moment.</p>
          </>
        )}

        {/* Success state */}
        {status === 'success' && (
          <>
            <div style={styles.iconWrap}>
              <div style={styles.iconSuccess}>✓</div>
            </div>
            <h1 style={styles.title}>Email verified!</h1>
            <p style={styles.sub}>{message}</p>
            <p style={styles.sub}>You can now log in to your FindCare account.</p>
            <button
              onClick={() => navigate('/login')}
              style={styles.btnGreen}
            >
              Log in to FindCare
            </button>
          </>
        )}

        {/* Error state */}
        {status === 'error' && (
          <>
            <div style={styles.iconWrap}>
              <div style={styles.iconError}>✕</div>
            </div>
            <h1 style={styles.title}>Verification failed</h1>
            <p style={styles.sub}>{message}</p>
            <p style={styles.sub}>
              Try registering again or contact support if the problem persists.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/register')} style={styles.btnGreen}>
                Register again
              </button>
              <button onClick={() => navigate('/')} style={styles.btnGray}>
                Go home
              </button>
            </div>
          </>
        )}

      </div>

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page:        { minHeight: '100vh', background: '#F8F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' },
  card:        { background: '#fff', borderRadius: '16px', border: '1px solid #E8E6E0', padding: '40px 32px', width: '100%', maxWidth: '420px', textAlign: 'center' },
  logo:        { fontSize: '24px', fontWeight: '700', color: '#1D9E75', marginBottom: '2px' },
  logoSub:     { fontSize: '12px', color: '#6B7280', marginBottom: '24px' },
  iconWrap:    { display: 'flex', justifyContent: 'center', marginBottom: '20px' },
  spinner:     { width: '48px', height: '48px', border: '4px solid #E8E6E0', borderTopColor: '#1D9E75', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  iconSuccess: { width: '48px', height: '48px', borderRadius: '50%', background: '#E1F5EE', color: '#1D9E75', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' },
  iconError:   { width: '48px', height: '48px', borderRadius: '50%', background: '#FCEBEB', color: '#A32D2D', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' },
  title:       { fontSize: '20px', fontWeight: '500', color: '#2C2C2A', marginBottom: '8px' },
  sub:         { fontSize: '14px', color: '#6B7280', marginBottom: '12px', lineHeight: '1.6' },
  btnGreen:    { padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#1D9E75', color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
  btnGray:     { padding: '10px 24px', borderRadius: '8px', border: '1px solid #E8E6E0', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' },
};