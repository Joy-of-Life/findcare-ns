import { render, screen, waitFor } from '@testing-library/react';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';

jest.mock('react-router-dom', () => {
  const React = jest.requireActual('react');
  return {
    Link: ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useLocation: () => ({ pathname: '/' }),
    useNavigate: () => jest.fn(),
  };
});

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

function renderNavbar(role = 'owner') {
  useAuth.mockReturnValue({
    user: { name: 'Test Owner', role },
    token: 'test-token',
    logout: jest.fn(),
  });
  return render(<Navbar />);
}

test('owner navigation displays the unread count beside Messages', async () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ count: 12 }),
  });

  try {
    renderNavbar();

    expect(await screen.findByRole('link', { name: 'Messages, 12 unread' })).toBeTruthy();
    expect(screen.getByText('9+')).toBeTruthy();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/messages/unread-count'),
      expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }),
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('owner navigation hides the unread badge when there are no unread messages', async () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ count: 0 }),
  });

  try {
    renderNavbar();

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.getByRole('link', { name: 'Messages' })).toBeTruthy();
    expect(screen.queryByText('0')).toBeNull();
  } finally {
    global.fetch = originalFetch;
  }
});

test('parent navigation does not request the owner unread count', () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn();

  try {
    renderNavbar('parent');
    expect(global.fetch).not.toHaveBeenCalled();
  } finally {
    global.fetch = originalFetch;
  }
});
