export default function ListingDisclaimer() {
  return (
    <p
      style={{
        margin: '10px 0 0',
        color: '#6B7280',
        fontSize: '11px',
        lineHeight: 1.5,
      }}
    >
      FindCare NS does not verify provider information or licensing status. Please confirm details directly with the provider and{' '}
      <a
        href="https://nsbr-online-services.novascotia.ca/DCSOnline/ECDS/loadSearchPage.action"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'inherit', textDecoration: 'underline' }}
      >
        check Nova Scotia’s official licensed-provider information
      </a>
      .
    </p>
  );
}
