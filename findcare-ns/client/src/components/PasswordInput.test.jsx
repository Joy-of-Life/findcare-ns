import { fireEvent, render, screen } from '@testing-library/react';
import PasswordInput from './PasswordInput';

test('password visibility toggles from hidden to visible and back', () => {
  render(
    <form>
      <PasswordInput
        id="password"
        aria-label="Password"
        value="secret123"
        onChange={() => {}}
      />
    </form>
  );

  const input = screen.getByLabelText('Password');
  expect(input.type).toBe('password');

  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(input.type).toBe('text');
  expect(screen.getByRole('button', { name: 'Hide password' }).getAttribute('aria-pressed')).toBe('true');

  fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
  expect(input.type).toBe('password');
});
