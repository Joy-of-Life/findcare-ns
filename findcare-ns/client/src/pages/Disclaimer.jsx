import { Link } from 'react-router-dom';
import './LegalDocument.css';

const childCareDirectoryUrl = 'https://nsbr-online-services.novascotia.ca/DCSOnline/ECDS/loadSearchPage.action';

export default function Disclaimer() {
  return (
    <main className="legal-document">
      <header className="legal-document__hero">
        <div className="legal-document__hero-inner">
          <p className="legal-document__eyebrow">About FindCare NS</p>
          <h1>Disclaimer</h1>
          <p>Important information about using the FindCare NS directory.</p>
        </div>
      </header>

      <article className="legal-document__content">
        <p className="legal-document__updated"><strong>Last updated:</strong> January 01, 2027</p>

        <section className="legal-document__section">
          <h2>About FindCare NS</h2>
          <p>
            FindCare NS is an independent online directory that helps Nova Scotia families find
            daycare centres and home daycares. We are not a child care provider, a licensing body,
            a regulator, or an agency of the Government of Nova Scotia.
          </p>
        </section>

        <section className="legal-document__section">
          <h2>Information is provided by providers</h2>
          <p>
            Daycare providers create and manage their own listings. This includes details such as
            name, address, daily rate, ages served, languages, capacity, availability, provider
            type, and licensing or approval status. FindCare NS does not verify this information,
            and we do not inspect or monitor providers.
          </p>
        </section>

        <section className="legal-document__section">
          <h2>Licensed, regulated and unlicensed providers are all listed</h2>
          <p>
            Our directory includes licensed child care centres, regulated family home child care
            providers, and unlicensed home child care providers. Providers choose their own
            provider type and confirm it when they list. We do not check it.
          </p>
          <p>
            Appearing on FindCare NS does not mean a provider is licensed, and a listing is not an
            endorsement, approval or recommendation by us. To check a provider’s licensing or
            approval status, please use the{' '}
            <a href={childCareDirectoryUrl} target="_blank" rel="noopener noreferrer">
              Nova Scotia Child Care Directory
            </a>.
          </p>
        </section>

        <section className="legal-document__section">
          <h2>Rates and availability can change</h2>
          <p>
            Daily rates are reported by providers and may not include government fee reductions or
            subsidies. Availability, open spots and other details may be out of date or change at
            any time. Please confirm current fees, spots and terms directly with the provider.
          </p>
        </section>

        <section className="legal-document__section">
          <h2>Ratings are parent opinions</h2>
          <p>
            Where star ratings appear, they are the opinions of individual parents. We do not
            verify that a parent used a provider’s services, and ratings are not FindCare NS’s
            assessment of any provider’s quality or safety. A provider with few or no ratings may be
            perfectly good, and a high rating is not a guarantee. A “New to FindCare” label means
            only that the listing was recently added to our site. It does not mean the provider is
            newly opened.
          </p>
        </section>

        <section className="legal-document__section">
          <h2>Your decision, your responsibility</h2>
          <p>
            Choosing child care is an important decision. Before choosing a provider, we encourage
            you to visit in person, ask about their policies, ratios, daily routine and emergency
            procedures, ask for references, and confirm their licensing or approval status. Nothing
            on this site is professional, legal or child care advice.
          </p>
        </section>

        <section className="legal-document__section">
          <h2>No guarantees</h2>
          <p>
            We try to keep this site accurate and available, but we do not guarantee that listings
            are complete, current or error-free, or that the service will be uninterrupted. FindCare
            NS is not responsible for any arrangement, agreement or dispute between families and
            providers.
          </p>
        </section>

        <section className="legal-document__section">
          <h2>Third-party links</h2>
          <p>
            Our site may link to other websites, such as provider pages or government sites. We do
            not control them and are not responsible for their content.
          </p>
        </section>

        <section className="legal-document__section">
          <h2>Report a concern</h2>
          <p>
            If you think a listing is inaccurate or misleading, email us at{' '}
            <a href="mailto:support@findcarens.com">support@findcarens.com</a>. For an urgent
            safety concern about a child, contact emergency services (911) or the appropriate
            provincial authority.
          </p>
        </section>

        <section className="legal-document__section">
          <h2>Related documents</h2>
          <p>
            This Disclaimer should be read together with our Terms of Service, Privacy Policy and{' '}
            <Link to="/provider-guidelines">Provider Guidelines</Link>.
          </p>
        </section>

        <section className="legal-document__section">
          <h2>Contact</h2>
          <p>
            Questions about this Disclaimer:{' '}
            <a href="mailto:support@findcarens.com">support@findcarens.com</a>
          </p>
        </section>
      </article>
    </main>
  );
}
