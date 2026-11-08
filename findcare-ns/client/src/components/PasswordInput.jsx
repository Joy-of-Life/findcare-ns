import { useState } from 'react';

export default function PasswordInput({ id, style, ...inputProps }) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={styles.wrapper}>
      <input
        {...inputProps}
        id={id}
        type={visible ? 'text' : 'password'}
        style={{ ...style, boxSizing: 'border-box', paddingRight: '46px' }}
      />
      <button
        type="button"
        onClick={() => setVisible(current => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        style={styles.toggle}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {visible ? (
            <>
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 002.8 2.8" />
              <path d="M9.9 5.2A10.7 10.7 0 0112 5c5 0 8.5 4.1 9.5 7-.4 1.1-1.1 2.2-2 3.2" />
              <path d="M6.2 6.2C3.9 7.6 2.8 9.7 2.5 12c.5 1.5 1.5 3 3 4.2A10.5 10.5 0 0012 19c1.2 0 2.3-.2 3.3-.6" />
            </>
          ) : (
            <>
              <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}

const styles = {
  wrapper: { position: 'relative', width: '100%' },
  toggle: {
    position: 'absolute',
    top: 0,
    right: '4px',
    height: '100%',
    width: '38px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6B7280',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
