import { render } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import ScrollToTop from './ScrollToTop';

jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
}));

describe('ScrollToTop', () => {
  let scrollTo;

  beforeEach(() => {
    scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(() => {
    scrollTo.mockRestore();
  });

  it('scrolls to the top when navigating to another route', () => {
    useLocation.mockReturnValue({ pathname: '/', hash: '' });
    const { rerender } = render(<ScrollToTop />);
    scrollTo.mockClear();

    useLocation.mockReturnValue({ pathname: '/provider-guidelines', hash: '' });
    rerender(<ScrollToTop />);

    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('does not override hash navigation', () => {
    useLocation.mockReturnValue({ pathname: '/', hash: '#faq' });
    render(<ScrollToTop />);

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
