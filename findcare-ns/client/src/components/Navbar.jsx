import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [hoveredBtn, setHoveredBtn] = useState(null);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>

        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>🏠</span>
          <span style={styles.logoText}>FindCare</span>
        </Link>

        {/* Center Navigation */}
        {!user && (
          <div style={styles.centerNav}>
            <a 
              href="#discover" 
              style={hoveredBtn === 'discover' ? styles.navLinkHover : styles.navLink}
              onMouseEnter={() => setHoveredBtn('discover')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              Discover Daycares
            </a>
            <a 
              href="#about" 
              style={hoveredBtn === 'about' ? styles.navLinkHover : styles.navLink}
              onMouseEnter={() => setHoveredBtn('about')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              About Us
            </a>
          </div>
        )}

        {/* Right Links */}
        <div style={styles.links}>
          {!user ? (
            <>
              <Link 
                to="/register" 
                style={hoveredBtn === 'list' ? styles.listBtnHover : styles.listBtn}
                onMouseEnter={() => setHoveredBtn('list')}
                onMouseLeave={() => setHoveredBtn(null)}
              >
                List your daycare
              </Link>
              <Link 
                to="/login" 
                style={hoveredBtn === 'login' ? styles.loginBtnHover : styles.loginBtn}
                onMouseEnter={() => setHoveredBtn('login')}
                onMouseLeave={() => setHoveredBtn(null)}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                style={hoveredBtn === 'register' ? styles.registerBtnHover : styles.registerBtn}
                onMouseEnter={() => setHoveredBtn('register')}
                onMouseLeave={() => setHoveredBtn(null)}
              >
                Register
              </Link>
            </>
          ) : (
            <>
              {user.role === 'parent' && (
                <>
                  <Link to="/dashboard" style={styles.link}>My dashboard</Link>
                  <Link to="/messages"  style={styles.link}>Messages</Link>
                  <Link to="/compare"   style={styles.link}>Compare</Link>
                </>
              )}
              {user.role === 'owner' && (
                <>
                  <Link to="/portal"   style={styles.link}>My portal</Link>
                  <Link to="/messages" style={styles.link}>Messages</Link>
                </>
              )}
              <span style={styles.userName}>Hi, {user.name.split(' ')[0]} 👋</span>
              <button 
                onClick={handleLogout} 
                style={hoveredBtn === 'logout' ? styles.logoutBtnHover : styles.logoutBtn}
                onMouseEnter={() => setHoveredBtn('logout')}
                onMouseLeave={() => setHoveredBtn(null)}
              >
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
    background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.3) 100%), url("https://images.unsplash.com/photo-1546776310-4ea93c37d11c?w=1200&h=120&fit=crop")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    position: 'relative',
    zIndex: 100,
    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.15)',
    borderBottom: 'none',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    height: '72px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    minWidth: '160px',
  },
  logoIcon: {
    fontSize: '24px',
  },
  logoText: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '-0.5px',
  },
  centerNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '40px',
    flex: 1,
    justifyContent: 'center',
  },
  navLink: {
    fontSize: '15px',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    cursor: 'pointer',
  },
  navLinkHover: {
    fontSize: '15px',
    color: '#ffb399',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    cursor: 'pointer',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: '320px',
    justifyContent: 'flex-end',
  },
  link: {
    fontSize: '14px',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: '600',
  },
  listBtn: {
    fontSize: '14px',
    background: '#4B9B7F',
    color: '#fff',
    padding: '10px 18px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: 'translateY(0)',
  },
  listBtnHover: {
    fontSize: '14px',
    background: '#3A7A61',
    color: '#fff',
    padding: '10px 18px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: 'translateY(-3px)',
    boxShadow: '0 8px 20px rgba(75, 155, 127, 0.4)',
  },
  loginBtn: {
    fontSize: '14px',
    background: '#D97563',
    color: '#fff',
    padding: '10px 18px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: 'translateY(0)',
  },
  loginBtnHover: {
    fontSize: '14px',
    background: '#C5574F',
    color: '#fff',
    padding: '10px 18px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: 'translateY(-3px)',
    boxShadow: '0 8px 20px rgba(217, 117, 99, 0.4)',
  },
  registerBtn: {
    fontSize: '14px',
    background: '#FF6B35',
    color: '#fff',
    padding: '10px 18px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: 'translateY(0)',
  },
  registerBtnHover: {
    fontSize: '14px',
    background: '#E85A1F',
    color: '#fff',
    padding: '10px 18px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 12px 28px rgba(255, 107, 53, 0.5)',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: 'translateY(-3px)',
  },
  logoutBtn: {
    fontSize: '13px',
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    color: '#ffffff',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: 'translateY(0)',
  },
  logoutBtnHover: {
    fontSize: '13px',
    background: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    color: '#ffffff',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(255, 255, 255, 0.1)',
  },
  userName: {
    fontSize: '13px',
    color: '#ffffff',
    fontWeight: '600',
  },
};