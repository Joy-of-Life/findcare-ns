import { Link } from 'react-router-dom';
import './LegalDocument.css';

const childCareDirectoryUrl = 'https://nsbr-online-services.novascotia.ca/DCSOnline/ECDS/loadSearchPage.action';

export default function ProviderGuidelines() {
  return (
    <main className="legal-document">
      <header className="legal-document__hero">
        <div className="legal-document__hero-inner">
          <p className="legal-document__eyebrow">For providers</p>
          <h1>Provider Guidelines</h1>
          <p>
            Help families see accurate, up-to-date information about your child care service.
          </p>
        </div>
      </header>

      <article className="legal-document__content">
        <p className="legal-document__updated"><strong>Last updated:</strong> January 01, 2027</p>
        <p className="legal-document__intro">
          Thank you for listing on FindCare NS. These guidelines help families see accurate,
          up-to-date information. They work alongside our Terms of Service, Privacy Policy and{' '}
          <Link to="/disclaimer">Disclaimer</Link>. If anything here conflicts with the Terms, the
          Terms apply.
        </p>

        <section className="legal-document__section">
          <h2>1. Choose the right provider type</h2>
          <p>Select the option that accurately describes your service:</p>
          <ul>
            <li><strong>Licensed child care centre:</strong> your centre holds a valid provincial child care licence.</li>
            <li><strong>Regulated family home child care provider:</strong> you operate your home daycare under a licensed family home day care agency.</li>
            <li><strong>Unlicensed home child care provider:</strong> your home daycare is not provincially licensed or regulated.</li>
          </ul>
          <p>
            When you publish your listing, you confirm that your provider type is accurate. If your
            status changes, update your listing promptly. FindCare NS does not verify your status,
            so what you tell families is your responsibility.
          </p>
        </section>

        <section className="legal-document__section">
          <h2>2. Describe your licensing honestly</h2>
          <ul>
            <li>Do not claim to be licensed or regulated if you are not.</li>
            <li>
              If you are unlicensed, do not describe or advertise your service as licensed or
              regulated. In particular, avoid words such as “licensed”, “regulated”,
              “child-care centre”, “preschool” and “family home child care” in your name,
              description or photos. Nova Scotia requirements restrict these terms for unregulated
              services.
            </li>
            <li>If you are licensed or regulated, be ready to share your licence or agency approval details if a parent asks.</li>
            <li>
              Parents can check licensing in the{' '}
              <a href={childCareDirectoryUrl} target="_blank" rel="noopener noreferrer">
                Nova Scotia Child Care Directory
              </a>.
            </li>
          </ul>
        </section>

        <section className="legal-document__section">
          <h2>3. Keep rates clear and accurate</h2>
          <ul>
            <li>Enter your standard daily fee <strong>before</strong> any government fee reductions or subsidies.</li>
            <li>Update the rate when your fees change.</li>
            <li>Be upfront in your description about any extra charges, such as registration, late pick-up or meals.</li>
          </ul>
        </section>

        <section className="legal-document__section">
          <h2>4. Stay within your capacity</h2>
          <ul>
            <li>Enter the maximum number of children you are permitted to care for. Do not list more than your approval, or the rules for your provider type, allow.</li>
            <li>Capacity includes your own children where the rules say so. Age-mix limits may also apply.</li>
            <li>Check the Government of Nova Scotia’s current child care requirements for your provider type. The limits can change, so do not rely on an old figure.</li>
          </ul>
        </section>

        <section className="legal-document__section">
          <h2>5. Keep availability current</h2>
          <p>
            Availability is our main feature, and parents rely on it. Update your open spots
            whenever they change, and show that you have no space when you are full. Out-of-date
            availability wastes parents’ time and reduces trust in your listing.
          </p>
        </section>

        <section className="legal-document__section">
          <h2>6. Write a helpful description</h2>
          <p>
            Tell families about your routines, approach, hours, meals, outdoor space and languages.
            Keep it truthful and respectful, and avoid promising things you cannot deliver, such as
            guaranteed spots or outcomes.
          </p>
        </section>

        <section className="legal-document__section">
          <h2>7. Protect children’s privacy</h2>
          <ul>
            <li>Do not post photos or videos showing identifiable children unless you have <strong>written consent</strong> from their parent or guardian.</li>
            <li>Do not share children’s names, health details or other personal information in your listing or in messages.</li>
            <li>If you operate from your home, consider choosing <strong>Hide my exact street address</strong>. Parents will then see your city and an approximate map location instead.</li>
          </ul>
        </section>

        <section className="legal-document__section">
          <h2>8. Communicate respectfully</h2>
          <ul>
            <li>Respond to parent enquiries promptly and honestly.</li>
            <li>Use messages and contact details only to discuss child care. No spam, unrelated promotions or harassment.</li>
            <li>Do not pressure parents or make claims about other providers.</li>
            <li>Enrolment agreements are between you and the family. FindCare NS is not a party to them.</li>
          </ul>
        </section>

        <section className="legal-document__section">
          <h2>9. Ratings</h2>
          <p>Parents may give your listing a star rating. Written comments are not part of the Service.</p>
          <ul>
            <li>Do not rate your own listing, ask others to submit fake ratings, offer incentives for ratings, or pressure parents about them.</li>
            <li>
              If you believe a rating is fake or retaliatory, report it to{' '}
              <a href="mailto:support@findcarens.com">support@findcarens.com</a>. We review reports,
              but we do not promise to remove a rating.
            </li>
            <li>Ratings are individual parent opinions and are not verified by us. A “New to FindCare” label means only that your listing was recently added.</li>
          </ul>
        </section>

        <section className="legal-document__section">
          <h2>10. What is not allowed</h2>
          <ul>
            <li>False or misleading information about your licensing, rates, capacity, services or availability</li>
            <li>Impersonating another provider or listing a daycare you are not authorized to represent</li>
            <li>Duplicate listings for the same service</li>
            <li>Content that is discriminatory, abusive, unlawful or unsafe</li>
            <li>Attempts to scrape, copy or misuse data from the site</li>
          </ul>
        </section>

        <section className="legal-document__section">
          <h2>11. What we may do</h2>
          <p>
            We may remove or suspend a listing, or ask you to correct it, if it breaks these
            guidelines or the Terms, or if we receive credible information that it is inaccurate or
            misleading. We do not inspect or verify listings, and our not taking action is not an
            endorsement.
          </p>
        </section>

        <section className="legal-document__section">
          <h2>12. Keep your listing up to date</h2>
          <p>
            We may email you from time to time to reconfirm your provider type, rate and capacity.
            Listings that are not reconfirmed may be marked as out of date or hidden until they are.
          </p>
        </section>

        <section className="legal-document__section">
          <h2>13. Report a concern</h2>
          <p>
            If you see a listing that looks inaccurate or misleading, or you have a question about
            these guidelines, email <a href="mailto:support@findcarens.com">support@findcarens.com</a>.
          </p>
        </section>
      </article>
    </main>
  );
}
