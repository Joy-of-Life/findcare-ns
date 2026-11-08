import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import BrandIcon from '../components/BrandIcon';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Register() {
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get('role') === 'owner' ? 'owner' : 'parent';
  const [form, setForm]       = useState(() => ({
    name: '',
    email: '',
    password: '',
    role: requestedRole,
    phone: '',
  }));
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [canResendVerification, setCanResendVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const navigate              = useNavigate();

  useEffect(() => {
    setForm(current => current.role === requestedRole ? current : { ...current, role: requestedRole });
  }, [requestedRole]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCanResendVerification(false);
    setResendMessage('');
    setLoading(true);
    try {
      const registrationData = {
        ...form,
        phone: form.role === 'parent' ? form.phone : undefined,
      };
      const res  = await fetch(`${API_URL}/api/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(registrationData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setCanResendVerification(data.code === 'EMAIL_NOT_VERIFIED');
      } else {
        setSuccess(data.message || 'Account created! Please check your email to verify your account. 🎉');
        setCanResendVerification(data.verificationEmailSent === false);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    setResending(true);
    setResendMessage('');
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
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
        <h1 style={styles.title}>Join FindCare NS! 🎈</h1>
        <p style={styles.sub}>Nova Scotia's childcare platform</p>

        {error   && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.successMsg}>{success}</div>}
        {canResendVerification && (
          <div style={{ marginBottom: '16px' }}>
            <button type="button" onClick={resendVerification} disabled={resending} style={styles.btn}>
              {resending ? 'Requesting link...' : 'Resend verification link'}
            </button>
            {resendMessage && <p role="status" style={styles.resendMessage}>{resendMessage}</p>}
          </div>
        )}

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

            {form.role === 'parent' && (
              <div style={styles.field}>
                <label style={styles.label} htmlFor="registration-phone">Mobile number (10 digits)</label>
                <input
                  id="registration-phone"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="10 digits, no spaces or punctuation"
                  autoComplete="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  title="Enter exactly 10 digits with no spaces or punctuation"
                  required
                  style={styles.input}
                />
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                minLength={6}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>I am a...</label>
              <div style={styles.roleRow}>
                {[
                  { value: 'parent', label: '👨‍👩‍👧 Parent looking for childcare' },
                  { value: 'owner',  label: '🏫 Daycare owner or provider'     },
                ].map(r => (
                  <div
                    key={r.value}
                    onClick={() => setForm(current => ({
                      ...current,
                      role: r.value,
                      ...(r.value === 'owner' ? { phone: '' } : {}),
                    }))}
                    style={{
                      ...styles.roleOption,
                      borderColor: form.role === r.value ? '#FF6B35' : '#FFCC80',
                      background:  form.role === r.value ? '#FFF3E0' : '#fff',
                    }}
                  >
                    <span style={{ fontSize: '13px', color: form.role === r.value ? '#E65100' : '#555' }}>
                      {r.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} style={styles.btn}>
              {loading ? 'Creating account...' : '🎈 Create account'}
            </button>
          </form>
        )}

        {success && (
          <button onClick={() => navigate('/login')} style={styles.btn}>
            Go to login →
          </button>
        )}

        <p style={styles.loginLink}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#FF6B35', fontWeight: '500' }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page:       { minHeight: '100vh', background: '#FFFDF9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' },
  card:       { background: '#fff', borderRadius: '20px', border: '2px solid #FFE0B2', padding: '40px 32px', width: '100%', maxWidth: '440px', textAlign: 'center' },
  logoWrap:   { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' },
  logoIcon:   { fontSize: '28px' },
  logoText:   { fontSize: '28px', fontWeight: '700', color: '#FF6B35' },
  logoSub:    { fontSize: '12px', color: '#9E9E9E', background: '#FFF3E0', padding: '2px 10px', borderRadius: '20px', border: '1px solid #FFCC80', display: 'inline-block', marginBottom: '20px' },
  title:      { fontSize: '22px', fontWeight: '700', color: '#2C2C2A', marginBottom: '4px' },
  sub:        { fontSize: '14px', color: '#6B7280', marginBottom: '24px' },
  error:      { background: '#FFEBEE', color: '#C62828', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', border: '1px solid #EF9A9A' },
  successMsg: { background: '#FFF3E0', color: '#E65100', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', border: '1px solid #FFCC80' },
  resendMessage: { color: '#6B7280', fontSize: '13px', lineHeight: '1.5', marginBottom: 0 },
  field:      { marginBottom: '16px', textAlign: 'left' },
  label:      { fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px', fontWeight: '500' },
  input:      { width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #FFCC80', fontSize: '14px', color: '#2C2C2A', background: '#FFFDF9', outline: 'none' },
  roleRow:    { display: 'flex', flexDirection: 'column', gap: '8px' },
  roleOption: { padding: '12px 14px', borderRadius: '10px', border: '2px solid', cursor: 'pointer', textAlign: 'left' },
  btn:        { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#FF6B35', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' },
  loginLink:  { textAlign: 'center', fontSize: '13px', color: '#6B7280', marginTop: '20px' },
};