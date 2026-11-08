import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Register from './Register';

jest.mock('react-router-dom', () => {
  const React = jest.requireActual('react');
  return {
    Link: ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useNavigate: () => jest.fn(),
    useSearchParams: () => [new URLSearchParams(globalThis.location.search)],
  };
});

function renderRegister(initialEntry) {
  window.history.replaceState({}, '', initialEntry);
  return render(<Register />);
}

test('selects daycare owner when registration is opened from the daycare listing link', () => {
  renderRegister('/register?role=owner');

  const ownerRole = screen.getByText('🏫 Daycare owner or provider').parentElement;
  const parentRole = screen.getByText('👨‍👩‍👧 Parent looking for childcare').parentElement;

  expect(ownerRole.style.borderColor).toBe('#ff6b35');
  expect(parentRole.style.borderColor).toBe('#ffcc80');
});

test('keeps parent as the default for normal registration links', () => {
  renderRegister('/register');

  const ownerRole = screen.getByText('🏫 Daycare owner or provider').parentElement;
  const parentRole = screen.getByText('👨‍👩‍👧 Parent looking for childcare').parentElement;

  expect(parentRole.style.borderColor).toBe('#ff6b35');
  expect(ownerRole.style.borderColor).toBe('#ffcc80');
});

test('requires a 10-digit phone from parents, but not daycare owners', () => {
  const { rerender } = renderRegister('/register');
  const parentPhone = screen.getByLabelText('Mobile number (10 digits)');
  expect(parentPhone.required).toBe(true);
  expect(parentPhone.pattern).toBe('[0-9]{10}');
  expect(parentPhone.maxLength).toBe(10);

  fireEvent.click(screen.getByText('🏫 Daycare owner or provider').parentElement);
  expect(screen.queryByLabelText('Mobile number (10 digits)')).toBeNull();

  window.history.replaceState({}, '', '/register?role=owner');
  rerender(<Register />);
  expect(screen.queryByLabelText('Mobile number (10 digits)')).toBeNull();
});

test('updates the selected role when navigating between Register and List your daycare', async () => {
  const { rerender } = renderRegister('/register');
  const ownerRole = screen.getByText('🏫 Daycare owner or provider').parentElement;
  const parentRole = screen.getByText('👨‍👩‍👧 Parent looking for childcare').parentElement;

  window.history.replaceState({}, '', '/register?role=owner');
  rerender(<Register />);
  await waitFor(() => expect(ownerRole.style.borderColor).toBe('#ff6b35'));
  expect(parentRole.style.borderColor).toBe('#ffcc80');

  window.history.replaceState({}, '', '/register');
  rerender(<Register />);
  await waitFor(() => expect(parentRole.style.borderColor).toBe('#ff6b35'));
  expect(ownerRole.style.borderColor).toBe('#ffcc80');
});

test('offers a verification resend after an unverified duplicate registration', async () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn()
    .mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        code: 'EMAIL_NOT_VERIFIED',
        error: 'Email already registered but not verified.',
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'If an unverified account exists, a link will be sent.' }),
    });
  global.fetch = fetchMock;

  try {
    renderRegister('/register');
    fireEvent.change(screen.getByPlaceholderText('sarah@example.com'), {
      target: { value: 'parent@example.com' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form'));

    fireEvent.click(await screen.findByRole('button', { name: 'Resend verification link' }));
    await screen.findByRole('status');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain('/api/auth/resend-verification');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ email: 'parent@example.com' });
  } finally {
    global.fetch = originalFetch;
  }
});
