import { fireEvent, render, screen } from '@testing-library/react';
import SearchBar from './SearchBar';

test('vacancy dropdown is first and offers Any status, Open, and Waitlist', () => {
  const onSearch = jest.fn();
  render(<SearchBar onSearch={onSearch} />);

  expect(screen.getByRole('button', { name: 'Toggle search filters' }).getAttribute('aria-expanded')).toBe('true');
  fireEvent.change(screen.getByRole('combobox', { name: 'Vacancy' }), {
    target: { value: 'open' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));

  expect(onSearch).toHaveBeenCalledWith({
    query: '',
    ageRange: '',
    language: '',
    maxPrice: '',
    rating: '',
    availabilityStatus: 'open',
  });
  expect(screen.getByRole('combobox', { name: 'Maximum daily price' })).not.toBeNull();
  expect(screen.getByRole('option', { name: 'Under $30/day' })).not.toBeNull();
  expect(screen.getAllByRole('combobox')[0].getAttribute('aria-label')).toBe('Vacancy');
  expect(screen.getByRole('option', { name: 'Any status' })).not.toBeNull();
  expect(screen.getByRole('option', { name: 'Waitlist' })).not.toBeNull();
});

test('vacancy status remains selected when clearing the age group', () => {
  const onSearch = jest.fn();
  render(<SearchBar onSearch={onSearch} />);

  fireEvent.change(screen.getByRole('combobox', { name: 'Vacancy' }), {
    target: { value: 'waitlist' },
  });
  fireEvent.change(screen.getByRole('combobox', { name: 'Age group' }), {
    target: { value: 'infant' },
  });
  fireEvent.change(screen.getByRole('combobox', { name: 'Age group' }), {
    target: { value: '' },
  });

  expect(screen.getByRole('combobox', { name: 'Vacancy' }).value).toBe('waitlist');
});
