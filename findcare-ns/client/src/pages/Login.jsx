import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login }           = useAuth();
  const navigate            = useNavigate();

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
        // Redirect based on role
        if (data.user.role === 'owner') {
          navigate('/portal');
        } else {
          navigate('/dashboard');
        }
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

        <div style={styles.logo}>FindCare</div>
        <h1 style={styles.title}>Welcome back</h1>
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

          <button
            type="submit"
            disabled={loading}
            style={styles.btn}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>

        </form>

        <p style={styles.registerLink}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#1D9E75' }}>Create one</Link>
        </p>

      </div>
    </div>
  );
}

const styles = {
  page:         { minHeight: '100vh', background: '#F8F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' },
  card:         { background: '#fff', borderRadius: '16px', border: '1px solid #E8E6E0', padding: '40px 32px', width: '100%', maxWidth: '440px' },
  logo:         { fontSize: '24px', fontWeight: '700', color: '#1D9E75', marginBottom: '8px' },
  title:        { fontSize: '20px', fontWeight: '500', color: '#2C2C2A', marginBottom: '4px' },
  sub:          { fontSize: '14px', color: '#6B7280', marginBottom: '24px' },
  error:        { background: '#FCEBEB', color: '#A32D2D', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' },
  field:        { marginBottom: '16px' },
  label:        { fontSize: '13px', color: '#374151', display: 'block', marginBottom: '6px', fontWeight: '500' },
  input:        { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E8E6E0', fontSize: '14px', color: '#2C2C2A', background: '#F8F7F4' },
  btn:          { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#1D9E75', color: '#fff', fontSize: '15px', fontWeight: '500', cursor: 'pointer', marginTop: '8px' },
  registerLink: { textAlign: 'center', fontSize: '13px', color: '#6B7280', marginTop: '20px' },
};