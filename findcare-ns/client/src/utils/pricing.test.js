import { formatDailyRate, hasDailyRate } from './pricing';

test('formats a confirmed daily rate', () => {
  expect(formatDailyRate(25.5)).toBe('$25.5/day');
  expect(hasDailyRate(0)).toBe(true);
});

test('does not present a missing or invalid rate as a price', () => {
  expect(formatDailyRate(null)).toBe('Daily rate not confirmed');
  expect(formatDailyRate(undefined)).toBe('Daily rate not confirmed');
  expect(hasDailyRate('not-a-number')).toBe(false);
});
