import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

test('hides stored legacy comments and prevents duplicate parent ratings', async () => {
  useAuth.mockReturnValue({
    user: { _id: 'parent-1', role: 'parent' },
    token: 'test-token',
  });
  global.fetch = jest.fn(async url => ({
    ok: true,
    json: async () => url.endsWith('/api/reviews/daycare-1')
      ? [{
          _id: 'rating-1',
          parent: { _id: 'parent-1', name: 'Test Parent' },
          rating: 4,
          text: 'This legacy comment must not appear',
          createdAt: '2026-11-07T12:00:00.000Z',
        }]
      : {
          _id: 'daycare-1',
          name: 'Joyful Jasmine',
          rating: 4,
          reviewCount: 1,
          ageRange: [],
          language: [],
        },
  }));

  render(<DaycareProfile />);

  expect(await screen.findByRole('heading', { name: /Parent ratings \(1\)/ })).not.toBeNull();
  expect(screen.queryByText('This legacy comment must not appear')).toBeNull();
  expect(screen.queryByText('Your review')).toBeNull();
  expect(screen.getByText(/You have already rated this daycare/)).not.toBeNull();
  expect(screen.getByRole('link', { name: 'support@findcarens.com' }).getAttribute('href'))
    .toBe('mailto:support@findcarens.com');
  expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
});

test('submits only a star rating', async () => {
  let submittedBody;
  useAuth.mockReturnValue({
    user: { id: 'parent-1', role: 'parent' },
    token: 'test-token',
  });
  global.fetch = jest.fn(async (url, options = {}) => {
    if (url.endsWith('/api/daycares/daycare-1')) {
      return {
        ok: true,
        json: async () => ({
          _id: 'daycare-1',
          name: 'Joyful Jasmine',
          createdAt: '2026-11-03T12:00:00.000Z',
          rating: submittedBody ? 5 : 0,
          reviewCount: submittedBody ? 1 : 0,
          ageRange: [],
          language: [],
        }),
      };
    }
    if (url.endsWith('/api/reviews/daycare-1') && options.method === 'POST') {
      submittedBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          _id: 'rating-1',
          parent: { _id: 'parent-1', name: 'Test Parent' },
          rating: submittedBody.rating,
        }),
      };
    }
    if (url.endsWith('/api/reviews/daycare-1')) {
      return { ok: true, json: async () => [] };
    }
    throw new Error(`Unexpected request: ${url}`);
  });

  render(<DaycareProfile />);

  fireEvent.click(await screen.findByRole('button', { name: '⭐ Submit rating' }));

  await waitFor(() => expect(submittedBody).toEqual({ rating: 5 }));
  expect(await screen.findByText(/Rating submitted!/)).not.toBeNull();
  expect(await screen.findByText(/You have already rated this daycare/)).not.toBeNull();
  expect(screen.getByRole('link', { name: 'support@findcarens.com' })).not.toBeNull();
  expect(screen.queryByText(/Your review|review text|comments/i)).toBeNull();
});
