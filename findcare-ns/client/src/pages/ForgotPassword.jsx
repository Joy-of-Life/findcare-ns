import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import BrandIcon from '../components/BrandIcon';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function ForgotPassword() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to process the request right now.');
      setMessage(data.message || 'If an account exists for this email, we’ll send password reset instructions.');
    } catch (requestError) {
      setError(requestError.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
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
        <h1 style={styles.title}>Forgot your password?</h1>
        <p style={styles.sub}>Enter your account email and we’ll send instructions to reset your password.</p>
        {error && <div role="alert" style={styles.error}>{error}</div>}
        {message && <div role="status" style={styles.success}>{message}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label htmlFor="reset-request-email" style={styles.label}>Email address</label>
            <input
              id="reset-request-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="sarah@example.com"
              required
              style={styles.input}
            />
          </div>
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Sending...' : 'Send reset instructions'}
          </button>
        </form>
        <p style={styles.loginLink}><Link to="/login" style={styles.link}>Back to log in</Link></p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#FFFDF9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' },
  card: { background: '#fff', borderRadius: '20px', border: '2px solid #FFE0B2', padding: '40px 32px', width: '100%', maxWidth: '440px', textAlign: 'center' },
  logoWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' },
  logoText: { fontSize: '28px', fontWeight: '700', color: '#FF6B35' },
  logoSub: { fontSize: '12px', color: '#9E9E9E', background: '#FFF3E0', padding: '2px 10px', borderRadius: '20px', border: '1px solid #FFCC80', display: 'inline-block', marginBottom: '20px' },
  title: { fontSize: '22px', fontWeight: '700', color: '#2C2C2A', marginBottom: '4px' },
  sub: { fontSize: '14px', color: '#6B7280', marginBottom: '24px', lineHeight: '1.6' },
  error: { background: '#FFEBEE', color: '#C62828', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', border: '1px solid #EF9A9A' },
  success: { background: '#E8F5E9', color: '#2E7D32', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', border: '1px solid #A5D6A7', lineHeight: '1.5' },
  field: { marginBottom: '16px', textAlign: 'left' },
  label: { fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '500' },
  input: { boxSizing: 'border-box', width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #FFCC80', fontSize: '14px', color: '#2C2C2A', background: '#FFFDF9', outline: 'none' },
  btn: { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#FF6B35', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' },
  loginLink: { textAlign: 'center', fontSize: '13px', color: '#6B7280', marginTop: '20px' },
  link: { color: '#FF6B35', fontWeight: '500' },
};
