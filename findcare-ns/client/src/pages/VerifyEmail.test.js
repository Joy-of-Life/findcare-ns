import { fireEvent, render, screen } from '@testing-library/react';
import VerifyEmail from './VerifyEmail';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new URLSearchParams(globalThis.location.search)],
}));

test('lets users request a new verification link when the page has no token', async () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      message: 'If an unverified account exists for this email, a new link will be sent.',
    }),
  });
  global.fetch = fetchMock;
  window.history.replaceState({}, '', '/verify-email');

  try {
    render(<VerifyEmail />);
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'parent@example.com' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Resend verification link' }).closest('form'));

    expect((await screen.findByRole('status')).textContent).toContain('If an unverified account exists');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/resend-verification'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'parent@example.com' }),
      }),
    );
  } finally {
    global.fetch = originalFetch;
  }
});
