export default function LicensingBadge({ licensed, providerType }) {
  const providerLabels = {
    licensedCentre: 'Licensed centre',
    regulatedFamilyHome: 'Regulated family home',
    unlicensedHome: 'Unlicensed home',
  };
  const isLicensed = licensed === true;
  const label = providerLabels[providerType] || (isLicensed ? 'Licensed' : 'Unlicensed');

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 9px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        color: isLicensed ? '#1B5E20' : '#B71C1C',
        background: isLicensed ? '#E8F5E9' : '#FDECEA',
        border: `1px solid ${isLicensed ? '#A5D6A7' : '#EF9A9A'}`,
      }}
    >
      {label}
    </span>
  );
}
