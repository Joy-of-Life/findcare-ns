export default function BrandIcon({ size = 32 }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path
        d="M12 22s8-6.15 8-13a8 8 0 1 0-16 0c0 6.85 8 13 8 13Z"
        fill="#FF6B35"
      />
      <path
        d="M12 12.15 9.75 10.1a1.72 1.72 0 0 1 2.25-2.6 1.72 1.72 0 0 1 2.25 2.6L12 12.15Z"
        fill="#4B9B7F"
        stroke="#fff"
        strokeWidth="0.65"
        strokeLinejoin="round"
      />
    </svg>
  );
}