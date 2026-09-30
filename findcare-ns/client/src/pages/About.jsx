import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Explore local care',
    text: 'Search daycare listings across Nova Scotia by location, age group, language, cost, and other practical details.',
  },
  {
    title: 'Compare your options',
    text: 'Review important details side by side to decide which programs are worth contacting.',
  },
  {
    title: 'Keep your search organized',
    text: 'Save daycares, manage waitlist entries, and turn on email alerts for openings at places you have saved.',
  },
];

export default function About() {
  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <p style={styles.eyebrow}>About FindCare NS</p>
          <h1 style={styles.heroTitle}>A clearer way to explore childcare in Nova Scotia.</h1>
          <p style={styles.heroText}>
            Finding care takes research. FindCare NS brings daycare information and useful planning tools together, so families can explore their options in one place.
          </p>
          <Link to="/?discover=1" style={styles.heroLink}>Browse daycares</Link>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.storyGrid}>
          <div>
            <p style={styles.sectionEyebrow}>Our purpose</p>
            <h2 style={styles.sectionTitle}>Make the search easier to navigate.</h2>
            <p style={styles.bodyText}>
              Families often need to check several details before contacting a childcare provider: location, age groups, hours, languages, fees, and availability. FindCare NS brings those details into a searchable directory and gives families tools to keep track of the places they are considering.
            </p>
            <p style={styles.bodyText}>
              We focus on Nova Scotia and aim to make the first steps of finding care more manageable, while leaving each family in control of what works for them.
            </p>
          </div>
          <aside style={styles.focusPanel}>
            <span style={styles.focusLabel}>Our focus</span>
            <strong style={styles.focusTitle}>Useful local information, organized around family needs.</strong>
            <span style={styles.focusText}>Search, compare, save, and follow up at your own pace.</span>
          </aside>
        </div>
      </section>

      <section style={styles.toolsSection}>
        <div style={styles.sectionInner}>
          <p style={styles.sectionEyebrow}>How FindCare NS helps</p>
          <h2 style={styles.sectionTitle}>Tools for each step of your search.</h2>
          <div style={styles.featureGrid}>
            {features.map((feature, index) => (
              <article key={feature.title} style={styles.feature}>
                <span style={styles.featureNumber}>0{index + 1}</span>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.bodyText}>{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={styles.noteSection}>
        <div style={styles.noteInner}>
          <div>
            <p style={styles.sectionEyebrow}>Please confirm details</p>
            <h2 style={styles.noteTitle}>Availability can change.</h2>
          </div>
          <p style={styles.bodyText}>
            Listing information is intended to help with your search and may not reflect current openings or program details. Contact the daycare directly to confirm availability, fees, hours, and licensing information before making plans.
          </p>
        </div>
      </section>

      <section style={styles.ctaSection}>
        <div>
          <p style={styles.ctaEyebrow}>Start with what matters to your family</p>
          <h2 style={styles.ctaTitle}>Explore childcare options near you.</h2>
        </div>
        <Link to="/?discover=1" style={styles.ctaLink}>Explore daycares</Link>
      </section>
    </main>
  );
}

const styles = {
  page: { background: '#F7F4EE', color: '#1F2937' },
  hero: {
    backgroundImage: "linear-gradient(105deg, rgba(14, 31, 47, 0.82), rgba(14, 31, 47, 0.32)), url('https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1800&q=85')",
    backgroundSize: 'cover',
    backgroundPosition: 'center 42%',
    padding: '78px 24px 86px',
  },
  heroInner: { maxWidth: '1120px', margin: '0 auto' },
  eyebrow: { color: '#FFD2B8', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 16px' },
  heroTitle: { color: '#fff', fontSize: '46px', lineHeight: 1.08, maxWidth: '720px', margin: '0 0 18px' },
  heroText: { color: '#F6F7F5', fontSize: '18px', lineHeight: 1.65, maxWidth: '660px', margin: '0 0 28px' },
  heroLink: { display: 'inline-block', background: '#FF6B35', color: '#fff', textDecoration: 'none', fontWeight: 700, padding: '13px 20px', borderRadius: '8px' },
  section: { padding: '72px 24px' },
  storyGrid: { maxWidth: '1120px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '48px', alignItems: 'center' },
  sectionEyebrow: { color: '#C34F27', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 12px' },
  sectionTitle: { color: '#1F2937', fontSize: '32px', lineHeight: 1.2, margin: '0 0 18px' },
  bodyText: { color: '#56616A', fontSize: '16px', lineHeight: 1.7, margin: '0 0 14px' },
  focusPanel: { display: 'flex', flexDirection: 'column', gap: '14px', background: '#E5F0EB', borderLeft: '4px solid #43856B', padding: '30px' },
  focusLabel: { color: '#356D57', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' },
  focusTitle: { color: '#244B3D', fontSize: '24px', lineHeight: 1.3 },
  focusText: { color: '#4A6258', fontSize: '15px', lineHeight: 1.6 },
  toolsSection: { background: '#fff', padding: '68px 24px' },
  sectionInner: { maxWidth: '1120px', margin: '0 auto' },
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '30px', marginTop: '34px' },
  feature: { borderTop: '2px solid #E5B192', paddingTop: '18px' },
  featureNumber: { color: '#C34F27', fontSize: '13px', fontWeight: 700 },
  featureTitle: { color: '#1F2937', fontSize: '20px', margin: '12px 0 8px' },
  noteSection: { background: '#F0E7D8', padding: '54px 24px' },
  noteInner: { maxWidth: '1120px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '34px', alignItems: 'center' },
  noteTitle: { color: '#1F2937', fontSize: '28px', margin: 0 },
  ctaSection: { maxWidth: '1120px', margin: '0 auto', padding: '56px 24px 68px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '24px' },
  ctaEyebrow: { color: '#C34F27', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 8px' },
  ctaTitle: { color: '#1F2937', fontSize: '28px', margin: 0 },
  ctaLink: { display: 'inline-block', background: '#244B3D', color: '#fff', textDecoration: 'none', fontWeight: 700, padding: '13px 20px', borderRadius: '8px' },
};