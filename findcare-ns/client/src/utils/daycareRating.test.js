import { getDaycareRatingStatus } from './daycareRating';

const now = new Date('2026-11-08T12:00:00.000Z');
const thirtyDays = 30 * 24 * 60 * 60 * 1000;

test('shows a new listing label before the 30-day cutoff', () => {
  const createdAt = new Date(now.getTime() - thirtyDays + 1).toISOString();

  expect(getDaycareRatingStatus({ createdAt }, now)).toEqual({
    type: 'new',
    label: 'New to FindCare',
  });
});

test('shows the first-rating prompt at and after the 30-day cutoff', () => {
  const createdAt = new Date(now.getTime() - thirtyDays).toISOString();

  expect(getDaycareRatingStatus({ createdAt }, now)).toEqual({
    type: 'unrated',
    label: 'Be the first to rate',
  });
});

test('an existing rating takes precedence regardless of listing age', () => {
  const createdAt = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();

  expect(getDaycareRatingStatus({ createdAt, rating: 4.5 }, now)).toEqual({
    type: 'rated',
    rating: 4.5,
  });
});

test.each([undefined, null, '', 'not-a-date'])(
  'does not show a new badge for invalid createdAt value %p',
  createdAt => {
    expect(getDaycareRatingStatus({ createdAt }, now)).toEqual({
      type: 'unrated',
      label: 'Be the first to rate',
    });
  }
);

test('does not treat a future-created listing as new', () => {
  const createdAt = new Date(now.getTime() + 1).toISOString();

  expect(getDaycareRatingStatus({ createdAt }, now)).toEqual({
    type: 'unrated',
    label: 'Be the first to rate',
  });
});
