import { Link } from 'react-router-dom';
import './SiteFooter.css';

const popularAreas = ['Halifax', 'Dartmouth', 'Bedford'];

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
        <div className="site-footer__table-wrap">
          <table className="site-footer__table">
            <thead>
              <tr>
                <th scope="col">For Parents</th>
                <th scope="col">For Providers</th>
                <th scope="col">Company</th>
                <th scope="col">Legal</th>
                <th scope="col">Popular Areas</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><Link to="/?discover=1">Browse daycares</Link></td>
                <td><Link to="/register?role=owner" onClick={scrollToTop}>List your daycare</Link></td>
                <td><Link to="/about">About Us</Link></td>
                <td><Link to="/about">Terms of Service</Link></td>
                <td><Link to={getPopularAreaLink(popularAreas[0])}>{popularAreas[0]}</Link></td>
              </tr>
              <tr>
                <td><Link to="/compare" onClick={scrollToTop}>Compare daycare</Link></td>
                <td><Link to="/login" onClick={scrollToTop}>Provider login</Link></td>
                <td><Link to="/#faq">FAQ</Link></td>
                <td><Link to="/about">Privacy Policy</Link></td>
                <td><Link to={getPopularAreaLink(popularAreas[1])}>{popularAreas[1]}</Link></td>
              </tr>
              <tr>
                <td><Link to="/dashboard#spot-alerts" onClick={focusSpotAlerts}>Spot alerts</Link></td>
                <td><Link to="/provider-guidelines">Provider guidelines</Link></td>
                <td><a href="mailto:support@findcarens.com">Contact Us</a></td>
                <td><Link to="/about">Disclaimer</Link></td>
                <td><Link to={getPopularAreaLink(popularAreas[2])}>{popularAreas[2]}</Link></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="site-footer__brand-line">
          <a className="site-footer__brand-name" href="https://www.findcarens.com/">FindCare NS</a>
          <span>Find daycare options with search, comparison tools and spot alerts.</span>
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
          <span>© {new Date().getFullYear()} FindCare NS. All rights reserved.</span>
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
