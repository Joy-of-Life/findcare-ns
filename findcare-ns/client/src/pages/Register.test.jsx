import { render, screen, waitFor } from '@testing-library/react';
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
