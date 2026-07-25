import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>

        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <span style={styles.logoText}>FindCare</span>
          <span style={styles.logoSub}>Nova Scotia</span>
        </Link>

        {/* Links */}
        <div style={styles.links}>
          {!user ? (
            <>
              <Link to="/login" style={styles.link}>Login</Link>
              <Link to="/register" style={styles.registerBtn}>Get started</Link>
            </>
          ) : (
            <>
              {user.role === 'parent' && (
                <Link to="/dashboard" style={styles.link}>My dashboard</Link>
              )}
              {user.role === 'owner' && (
                <Link to="/portal" style={styles.link}>My portal</Link>
              )}
              <span style={styles.userName}>Hi, {user.name.split(' ')[0]}</span>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                Logout
              </button>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}

const styles = {
  nav: {
    background:   '#fff',
    borderBottom: '1px solid #E8E6E0',
    position:     'sticky',
    top:          0,
    zIndex:       100,
  },
  container: {
    maxWidth:      '1100px',
    margin:        '0 auto',
    padding:       '0 16px',
    height:        '60px',
    display:       'flex',
    alignItems:    'center',
    justifyContent:'space-between',
  },
  logo: {
    display:    'flex',
    alignItems: 'baseline',
    gap:        '6px',
  },
  logoText: {
    fontSize:   '20px',
    fontWeight: '600',
    color:      '#1D9E75',
  },
  logoSub: {
    fontSize: '12px',
    color:    '#6B7280',
  },
  links: {
    display:    'flex',
    alignItems: 'center',
    gap:        '16px',
  },
  link: {
    fontSize: '14px',
    color:    '#374151',
  },
  registerBtn: {
    fontSize:     '14px',
    background:   '#1D9E75',
    color:        '#fff',
    padding:      '8px 16px',
    borderRadius: '8px',
  },
  logoutBtn: {
    fontSize:     '14px',
    background:   'transparent',
    border:       '1px solid #E8E6E0',
    color:        '#374151',
    padding:      '6px 12px',
    borderRadius: '8px',
  },
  userName: {
    fontSize: '14px',
    color:    '#6B7280',
  },
};
