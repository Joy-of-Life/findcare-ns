import { Link } from 'react-router-dom';
import BrandIcon from './BrandIcon';
import './SiteFooter.css';

const popularAreas = ['Halifax', 'Dartmouth', 'Bedford', 'Lower Sackville', 'Truro', 'Sydney'];

function getPopularAreaLink(area) {
  const params = new URLSearchParams({ city: area, discover: '1' });
  return `/?${params.toString()}`;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function focusSpotAlerts() {
  window.setTimeout(() => {
    const spotAlerts = document.getElementById('spot-alerts');
    if (spotAlerts) spotAlerts.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else scrollToTop();
  }, 0);
}

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__nav-grid">
          <nav className="site-footer__column" aria-label="For parents">
            <h2>For Parents</h2>
            <Link to="/?discover=1">Browse daycares</Link>
            <Link to="/compare" onClick={scrollToTop}>Compare daycare</Link>
            <Link to="/dashboard#spot-alerts" onClick={focusSpotAlerts}>Spot alerts</Link>
            <Link to="/login" onClick={scrollToTop}>Parent login</Link>
            <Link to="/register" onClick={scrollToTop}>Create account</Link>
          </nav>

          <nav className="site-footer__column" aria-label="For providers">
            <h2>For Providers</h2>
            <Link to="/register?role=owner" onClick={scrollToTop}>List your daycare</Link>
            <Link to="/login" onClick={scrollToTop}>Provider login</Link>
            <Link to="/about">Provider guidelines</Link>
          </nav>

          <nav className="site-footer__column" aria-label="Company">
            <h2>Company</h2>
            <Link to="/about">About Us</Link>
            <Link to="/#faq">FAQ</Link>
            <a href="mailto:support@findcarens.com">Contact Support</a>
          </nav>

          <nav className="site-footer__column" aria-label="Legal">
            <h2>Legal</h2>
            <Link to="/about">Terms of Service</Link>
            <Link to="/about">Privacy Policy</Link>
            <Link to="/about">Disclaimer</Link>
          </nav>

          <nav className="site-footer__column" aria-label="Popular areas">
            <h2>Popular Areas</h2>
            {popularAreas.map(area => (
              <Link key={area} to={getPopularAreaLink(area)}>{area}</Link>
            ))}
          </nav>
        </div>

        <div className="site-footer__brand">
          <Link className="site-footer__brand-link" to="/" aria-label="FindCare NS home">
            <BrandIcon size={22} />
            <span>FindCare NS</span>
          </Link>
          <p>Find daycare options with search, comparison tools and spot alerts.</p>
          <a href="mailto:support@findcarens.com">support@findcarens.com</a>
        </div>

        <p className="site-footer__disclaimer">
          FindCare NS is an independent directory. Provider details, including licensing status, are
          submitted by providers and not verified by us. Please confirm directly with the provider or
          check the{' '}
          <a
            href="https://nsbr-online-services.novascotia.ca/DCSOnline/ECDS/loadSearchPage.action"
            target="_blank"
            rel="noopener noreferrer"
          >
            Nova Scotia Child Care Directory
          </a>.
        </p>

        <div className="site-footer__bottom">
          <span>© 2026 FindCare NS. All rights reserved.</span>
          <nav className="site-footer__legal" aria-label="Legal links">
            <Link to="/about">Terms</Link>
            <span aria-hidden="true">·</span>
            <Link to="/about">Privacy</Link>
            <span aria-hidden="true">·</span>
            <Link to="/about">Disclaimer</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
