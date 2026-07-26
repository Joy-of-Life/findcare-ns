import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Register() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'parent' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate              = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res  = await fetch(`${API_URL}/api/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {
        setSuccess('Account created! Please check your email to verify your account.');
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
        <h1 style={styles.title}>Create your account</h1>
        <p style={styles.sub}>Join Nova Scotia's childcare platform</p>

        {error   && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        {!success && (
          <form onSubmit={handleSubmit}>

            <div style={styles.field}>
              <label style={styles.label}>Full name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Sarah Johnson"
                required
                style={styles.input}
              />
            </div>

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
                placeholder="At least 6 characters"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>I am a...</label>
              <div style={styles.roleRow}>
                {[
                  { value: 'parent', label: '👨‍👩‍👧 Parent looking for childcare' },
                  { value: 'owner',  label: '🏫 Daycare owner or provider' },
                ].map(r => (
                  <div
                    key={r.value}
                    onClick={() => setForm({ ...form, role: r.value })}
                    style={{
                      ...styles.roleOption,
                      borderColor: form.role === r.value ? '#1D9E75' : '#E8E6E0',
                      background:  form.role === r.value ? '#E1F5EE' : '#fff',
                    }}
                  >
                    <span style={{ fontSize: '13px', color: form.role === r.value ? '#085041' : '#374151' }}>
                      {r.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={styles.btn}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>

          </form>
        )}

        <p style={styles.loginLink}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#1D9E75' }}>Log in</Link>
        </p>

      </div>
    </div>
  );
}

const styles = {
  page:       { minHeight: '100vh', background: '#F8F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' },
  card:       { background: '#fff', borderRadius: '16px', border: '1px solid #E8E6E0', padding: '40px 32px', width: '100%', maxWidth: '440px' },
  logo:       { fontSize: '24px', fontWeight: '700', color: '#1D9E75', marginBottom: '8px' },
  title:      { fontSize: '20px', fontWeight: '500', color: '#2C2C2A', marginBottom: '4px' },
  sub:        { fontSize: '14px', color: '#6B7280', marginBottom: '24px' },
  error:      { background: '#FCEBEB', color: '#A32D2D', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' },
  success:    { background: '#E1F5EE', color: '#085041', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' },
  field:      { marginBottom: '16px' },
  label:      { fontSize: '13px', color: '#374151', display: 'block', marginBottom: '6px', fontWeight: '500' },
  input:      { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E8E6E0', fontSize: '14px', color: '#2C2C2A', background: '#F8F7F4' },
  roleRow:    { display: 'flex', flexDirection: 'column', gap: '8px' },
  roleOption: { padding: '12px 14px', borderRadius: '8px', border: '2px solid', cursor: 'pointer' },
  btn:        { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#1D9E75', color: '#fff', fontSize: '15px', fontWeight: '500', cursor: 'pointer', marginTop: '8px' },
  loginLink:  { textAlign: 'center', fontSize: '13px', color: '#6B7280', marginTop: '20px' },
};