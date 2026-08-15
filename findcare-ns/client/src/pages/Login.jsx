import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
      } else {
        login(data.user, data.token);
        if (data.user.role === 'owner') navigate('/portal');
        else navigate('/dashboard');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
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
        <h1 style={styles.title}>Welcome back! 👋</h1>
        <p style={styles.sub}>Log in to your Nova Scotia childcare account</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="sarah@example.com"
              required
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Your password"
              required
              style={styles.input}
            />
          </div>
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Logging in...' : '🔓 Log in'}
          </button>
        </form>

        <p style={styles.registerLink}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#FF6B35', fontWeight: '500' }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page:         { minHeight: '100vh', background: '#FFFDF9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' },
  card:         { background: '#fff', borderRadius: '20px', border: '2px solid #FFE0B2', padding: '40px 32px', width: '100%', maxWidth: '440px', textAlign: 'center' },
  logoWrap:     { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' },
  logoIcon:     { fontSize: '28px' },
  logoText:     { fontSize: '28px', fontWeight: '700', color: '#FF6B35' },
  logoSub:      { fontSize: '12px', color: '#9E9E9E', background: '#FFF3E0', padding: '2px 10px', borderRadius: '20px', border: '1px solid #FFCC80', display: 'inline-block', marginBottom: '20px' },
  title:        { fontSize: '22px', fontWeight: '700', color: '#2C2C2A', marginBottom: '4px' },
  sub:          { fontSize: '14px', color: '#6B7280', marginBottom: '24px' },
  error:        { background: '#FFEBEE', color: '#C62828', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', border: '1px solid #EF9A9A' },
  field:        { marginBottom: '16px', textAlign: 'left' },
  label:        { fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '500' },
  input:        { width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #FFCC80', fontSize: '14px', color: '#2C2C2A', background: '#FFFDF9', outline: 'none' },
  btn:          { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#FF6B35', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' },
  registerLink: { textAlign: 'center', fontSize: '13px', color: '#6B7280', marginTop: '20px' },
};