import { fireEvent, render, screen } from '@testing-library/react';
import SearchBar from './SearchBar';

test('vacancy filter is available without an age group and searches all categories', () => {
  const onSearch = jest.fn();
  render(<SearchBar onSearch={onSearch} />);

  fireEvent.click(screen.getByRole('button', { name: 'Toggle search filters' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Daycares with vacancies' }));
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));

  expect(onSearch).toHaveBeenCalledWith({
    query: '',
    ageRange: '',
    language: '',
    maxPrice: '',
    rating: '',
    availableOnly: true,
  });
});

test('vacancy filter remains selected when clearing the age group', () => {
  const onSearch = jest.fn();
  render(<SearchBar onSearch={onSearch} />);

  fireEvent.click(screen.getByRole('button', { name: 'Toggle search filters' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Daycares with vacancies' }));
  fireEvent.change(screen.getByRole('combobox', { name: 'Age group' }), {
    target: { value: 'infant' },
  });
  fireEvent.change(screen.getByRole('combobox', { name: 'Age group' }), {
    target: { value: '' },
  });

  expect(screen.getByRole('checkbox', { name: 'Daycares with vacancies' }).checked).toBe(true);
});
