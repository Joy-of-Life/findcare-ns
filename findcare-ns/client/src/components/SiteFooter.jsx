import { Link } from 'react-router-dom';
import BrandIcon from './BrandIcon';
import './SiteFooter.css';

const popularAreas = ['Halifax', 'Dartmouth', 'Bedford', 'Lower Sackville'];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__main">
          <div className="site-footer__brand">
            <Link className="site-footer__brand-link" to="/" aria-label="FindCare NS home">
              <BrandIcon size={22} />
              <span>FindCare NS</span>
            </Link>
            <p>Find daycare options with search, comparison tools and spot alerts.</p>
            <a href="mailto:support@findcarens.com">support@findcarens.com</a>
          </div>

          <nav className="site-footer__column" aria-label="For parents">
            <h2>For Parents</h2>
            <Link to="/?discover=1">Browse daycares</Link>
            <Link to="/compare">Compare daycares</Link>
            <Link to="/dashboard">Spot alerts</Link>
            <Link to="/login">Parent login</Link>
            <Link to="/register">Create account</Link>
          </nav>

          <nav className="site-footer__column" aria-label="For providers">
            <h2>For Providers</h2>
            <Link to="/register?role=owner">List your daycare</Link>
            <Link to="/login">Provider login</Link>
            <Link to="/about">Provider guidelines</Link>
          </nav>

          <div className="site-footer__other-links">
            <nav className="site-footer__column" aria-label="Company and legal">
              <h2>Company &amp; Legal</h2>
              <Link to="/about">About Us</Link>
              <Link to="/#faq">FAQ</Link>
              <Link to="/about">Contact</Link>
              <Link to="/about">Support</Link>
              <Link to="/about">Terms of Service</Link>
              <Link to="/about">Privacy Policy</Link>
              <Link to="/about">Disclaimer</Link>
            </nav>

            <nav className="site-footer__column" aria-label="Popular areas">
              <h2>Popular Areas</h2>
              {popularAreas.map(area => (
                <Link key={area} to={`/?city=${encodeURIComponent(area)}&discover=1`}>{area}</Link>
              ))}
              <Link to="/?discover=1">…</Link>
            </nav>
          </div>
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
