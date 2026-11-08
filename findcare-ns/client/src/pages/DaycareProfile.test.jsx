import { fireEvent, render, screen } from '@testing-library/react';
import DaycareProfile from './DaycareProfile';
import { useAuth } from '../context/AuthContext';

const mockNavigate = jest.fn();
const mockLocation = { pathname: '/daycare/daycare-1', state: { returnTo: '/dashboard' } };

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
  useParams: () => ({ id: 'daycare-1' }),
}));

jest.mock('../components/MapView', () => () => null);

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

test('shows a dashboard back link and returns to the parent dashboard', async () => {
  useAuth.mockReturnValue({
    user: { id: 'parent-1', role: 'parent' },
    token: 'test-token',
  });
  global.fetch = jest.fn(async url => ({
    ok: true,
    json: async () => url.endsWith('/api/reviews/daycare-1')
      ? []
      : { _id: 'daycare-1', name: 'Joyful Jasmine', ageRange: [], language: [] },
  }));

  render(<DaycareProfile />);

  const backButton = await screen.findByRole('button', { name: '← Back to dashboard' });
  fireEvent.click(backButton);

  expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
});
