import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import BrandIcon from './BrandIcon';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const isHomePage = location.pathname === '/';

  function handleLogout() {
    logout();
    navigate('/');
  }

  function handleFaqClick(event) {
    event.preventDefault();
    const target = document.getElementById('faq');

    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const faqElement = document.getElementById('faq');
        if (faqElement) {
          const navOffset = 90;
          const top = faqElement.getBoundingClientRect().top + window.scrollY - navOffset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    if (target) {
      const navOffset = 90;
      const top = target.getBoundingClientRect().top + window.scrollY - navOffset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  return (
    <nav className="findcare-navbar" style={isHomePage ? styles.homeNav : styles.nav}>
      <div className="findcare-navbar__container" style={styles.container}>

        {/* Logo */}
        <Link to="/" className="findcare-navbar__brand" style={styles.logo}>
          <BrandIcon size={34} />
          <span style={styles.logoText}>FindCare</span>
        </Link>

        {/* Center Navigation */}
        {!user && (
          <div className="findcare-navbar__center" style={styles.centerNav}>
            <Link
              to="/?discover=1"
              style={hoveredBtn === 'discover' ? styles.navLinkHover : styles.navLink}
              onMouseEnter={() => setHoveredBtn('discover')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              Browse All Daycares
            </Link>
            <Link
              to="/about"
              style={hoveredBtn === 'about' ? styles.navLinkHover : styles.navLink}
              onMouseEnter={() => setHoveredBtn('about')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              About Us
            </Link>
            <Link
              to="/#faq"
              onClick={handleFaqClick}
              style={hoveredBtn === 'faq' ? styles.navLinkHover : styles.navLink}
              onMouseEnter={() => setHoveredBtn('faq')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              FAQ
            </Link>
          </div>
        )}

        {/* Right Links */}
        <div className="findcare-navbar__links" style={styles.links}>
          {!user ? (
            <>
              <Link 
                to="/register" 
                className="findcare-navbar__list-button"
                style={hoveredBtn === 'list' ? styles.listBtnHover : styles.listBtn}
                onMouseEnter={() => setHoveredBtn('list')}
                onMouseLeave={() => setHoveredBtn(null)}
              >
                List your daycare
              </Link>
              <Link 
                to="/login" 
                className="findcare-navbar__login-button"
                style={hoveredBtn === 'login' ? styles.loginBtnHover : styles.loginBtn}
                onMouseEnter={() => setHoveredBtn('login')}
                onMouseLeave={() => setHoveredBtn(null)}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="findcare-navbar__register-button"
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
                  <Link to="/dashboard" className="findcare-navbar__dashboard-link" style={styles.link}>My dashboard</Link>
                  <Link to="/messages" className="findcare-navbar__message-link" style={styles.link}>Messages</Link>
                  <Link to="/compare" className="findcare-navbar__compare-link" style={styles.link}>Compare</Link>
                </>
              )}
              {user.role === 'owner' && (
                <>
                  <Link to="/portal" className="findcare-navbar__dashboard-link" style={styles.link}>My portal</Link>
                  <Link to="/messages" className="findcare-navbar__message-link" style={styles.link}>Messages</Link>
                </>
              )}
              <span className="findcare-navbar__user-name" style={styles.userName}>Hi, {user.name.split(' ')[0]} 👋</span>
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
    width: 'calc(100% - 32px)',
    maxWidth: 'none',
    margin: '12px auto',
    background: 'rgba(42, 48, 45, 0.32)',
    backdropFilter: 'blur(14px) saturate(125%)',
    WebkitBackdropFilter: 'blur(14px) saturate(125%)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '18px',
    boxShadow: '0 10px 28px rgba(15, 23, 20, 0.16)',
    overflow: 'hidden',
    zIndex: 100,
  },
  homeNav: {
    width: 'calc(100% - 32px)',
    maxWidth: 'none',
    position: 'absolute',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    margin: 0,
    background: 'rgba(42, 48, 45, 0.18)',
    backdropFilter: 'blur(12px) saturate(135%)',
    WebkitBackdropFilter: 'blur(12px) saturate(135%)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    borderRadius: '18px',
    boxShadow: '0 10px 28px rgba(15, 23, 20, 0.16)',
    overflow: 'hidden',
    zIndex: 100,
  },
  container: {
    maxWidth: 'none',
    margin: '0 auto',
    padding: '0 22px',
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