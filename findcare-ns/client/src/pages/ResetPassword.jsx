import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BrandIcon from '../components/BrandIcon';
import PasswordInput from '../components/PasswordInput';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to reset your password.');
      setSuccess(true);
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
        {success ? (
          <>
            <h1 style={styles.title}>Password updated</h1>
            <p style={styles.sub}>Your password has been reset. Please log in with your new password.</p>
            <Link to="/login" style={styles.btn}>Go to log in</Link>
          </>
        ) : !token ? (
          <>
            <h1 style={styles.title}>Reset link unavailable</h1>
            <p style={styles.sub}>This password reset link is invalid or expired. Request a new one to continue.</p>
            <Link to="/forgot-password" style={styles.btn}>Request a new link</Link>
          </>
        ) : (
          <>
            <h1 style={styles.title}>Choose a new password</h1>
            <p style={styles.sub}>Your password must be at least 6 characters long.</p>
            {error && <div role="alert" style={styles.error}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div style={styles.field}>
                <label htmlFor="new-password" style={styles.label}>New password</label>
                <PasswordInput
                  id="new-password"
                  autoComplete="new-password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  minLength={6}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label htmlFor="confirm-password" style={styles.label}>Confirm new password</label>
                <PasswordInput
                  id="confirm-password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                  minLength={6}
                  required
                  style={styles.input}
                />
              </div>
              <button type="submit" disabled={loading} style={styles.btn}>
                {loading ? 'Updating password...' : 'Reset password'}
              </button>
            </form>
          </>
        )}
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
  field: { marginBottom: '16px', textAlign: 'left' },
  label: { fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '500' },
  input: { boxSizing: 'border-box', width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #FFCC80', fontSize: '14px', color: '#2C2C2A', background: '#FFFDF9', outline: 'none' },
  btn: { display: 'inline-block', boxSizing: 'border-box', width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#FF6B35', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '8px', textDecoration: 'none' },
};
