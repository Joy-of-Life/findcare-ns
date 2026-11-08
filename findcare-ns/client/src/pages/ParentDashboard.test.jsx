import { render, screen } from '@testing-library/react';
import ParentDashboard from './ParentDashboard';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

test('shows unread messages addressed to the signed-in parent', async () => {
  useAuth.mockReturnValue({
    user: { id: 'parent-1', name: 'Test Parent', role: 'parent' },
    token: 'test-token',
  });
  global.fetch = jest.fn(async url => {
    if (url.endsWith('/api/auth/me')) {
      return { ok: true, json: async () => ({ savedDaycares: [] }) };
    }
    if (url.endsWith('/api/waitlist/my/all')) {
      return { ok: true, json: async () => [] };
    }
    if (url.endsWith('/api/messages')) {
      return {
        ok: true,
        json: async () => [
          { to: { _id: 'parent-1' }, read: false },
          { to: { _id: 'parent-1' }, read: true },
          { to: { _id: 'daycare-owner-1' }, read: false },
        ],
      };
    }
    throw new Error(`Unexpected request: ${url}`);
  });

  render(<ParentDashboard />);

  expect(await screen.findByText('You have 1 unread message from daycare owners.')).not.toBeNull();
  expect(screen.getByText('Messages').parentElement.textContent).toContain('1');
});
