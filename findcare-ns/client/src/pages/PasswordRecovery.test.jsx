import { fireEvent, render, screen } from '@testing-library/react';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

jest.mock('react-router-dom', () => {
  const React = jest.requireActual('react');
  return {
    Link: ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useLocation: () => ({ state: { email: 'parent@example.com' } }),
    useSearchParams: () => [new URLSearchParams(globalThis.location.search)],
  };
});

test('forgot password shows a neutral confirmation after submitting an email', async () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      message: 'If an account exists for this email, we’ll send password reset instructions.',
    }),
  });
  global.fetch = fetchMock;

  try {
    render(<ForgotPassword />);
    expect(screen.getByLabelText('Email address').value).toBe('parent@example.com');
    fireEvent.click(screen.getByRole('button', { name: 'Send reset instructions' }));

    expect((await screen.findByRole('status')).textContent).toContain('If an account exists');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/forgot-password'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'parent@example.com' }),
      }),
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('reset password checks confirmation before submitting', () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();
  global.fetch = fetchMock;
  window.history.replaceState({}, '', '/reset-password?token=abc');

  try {
    render(<ResetPassword />);
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-password' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'different-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(screen.getByRole('alert').textContent).toBe('The passwords do not match.');
    expect(fetchMock).not.toHaveBeenCalled();
  } finally {
    global.fetch = originalFetch;
  }
});

test('successful password reset offers a link back to login', async () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ message: 'Your password has been reset.' }),
  });
  global.fetch = fetchMock;
  window.history.replaceState({}, '', '/reset-password?token=abc');

  try {
    render(<ResetPassword />);
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-password' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'new-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(await screen.findByText('Password updated')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Go to log in' }).getAttribute('href')).toBe('/login');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      token: 'abc',
      password: 'new-password',
    });
  } finally {
    global.fetch = originalFetch;
  }
});
